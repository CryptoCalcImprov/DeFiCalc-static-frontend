"use client";

import { FormEvent, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

const starterPrompts = [
  "How can I calculate yield?",
  "Explain TVL vs APY",
  "Show safe ETH strategies",
];

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function NovaAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! Ask me about strategy health, projected yields, or how to model a position in the Calculator Sandbox.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processPrompt = async (rawPrompt: string) => {
    const prompt = rawPrompt.trim();
    if (!prompt) {
      return;
    }

    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setInput("");
    setIsLoading(true);

    const baseUrl = process.env.NEXT_PUBLIC_NOVA_API_URL?.trim();
    let requestUrl = "/ai";

    if (baseUrl) {
      const sanitized = baseUrl.endsWith("/ai") ? baseUrl : `${baseUrl.replace(/\/$/, "")}/ai`;
      requestUrl = sanitized;
    }

    let hostHeader: string | undefined;
    try {
      const parsedUrl = new URL(
        requestUrl,
        requestUrl.startsWith("http") ? undefined : typeof window !== "undefined" ? window.location.origin : undefined,
      );
      hostHeader = parsedUrl.host;
      requestUrl = parsedUrl.toString();
    } catch (error) {
      if (typeof window !== "undefined") {
        hostHeader = window.location.host;
      }
    }

    const headers = new Headers({
      "Content-Type": "application/json",
    });

    if (hostHeader) {
      headers.set("Host", hostHeader);
    }

    const apiKey = process.env.NEXT_PUBLIC_NOVA_API_KEY?.trim();
    if (apiKey) {
      headers.set("Authorization", `Bearer ${apiKey}`);
    }

    const body = {
      input: prompt,
      model: "gpt-5-mini",
      temperature: 0.7,
      verbosity: "medium",
      max_tokens: 500,
      reasoning: false,
      reasoning_params: {},
      image_urls: [],
    };

    try {
      const response = await fetch(requestUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const contentType = response.headers.get("content-type");
      let assistantReply = "";

      if (contentType?.includes("application/json")) {
        try {
          const data = await response.json();
          assistantReply =
            data?.output ??
            data?.message ??
            data?.content ??
            data?.reply ??
            (typeof data === "string" ? data : JSON.stringify(data));
        } catch (jsonError) {
          assistantReply = await response.text();
        }
      } else {
        assistantReply = await response.text();
      }

      if (!response.ok) {
        throw new Error(assistantReply || `Nova responded with status ${response.status}`);
      }

      setMessages((prev) => [...prev, { role: "assistant", content: assistantReply || "Nova had no response." }]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Something went wrong while talking to Nova. Please try again.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I ran into an issue processing that request: ${errorMessage}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await processPrompt(input);
  };

  const handleStarterPrompt = (prompt: string, { autoSubmit = false } = {}) => {
    setInput(prompt);

    if (autoSubmit) {
      void processPrompt(prompt);
    } else {
      inputRef.current?.focus();
    }
  };

  return (
    <div id="nova">
      <button
        type="button"
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-cta-gradient px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-cyan-500/30 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="inline-flex h-2 w-2 rounded-full bg-white" aria-hidden />
        Ask Nova
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setOpen(false)} aria-hidden />
          <div className="relative mt-auto w-full max-w-md rounded-t-3xl border border-slate-800/70 bg-surface/95 p-6 shadow-2xl md:mt-0 md:rounded-3xl md:mr-8 md:mb-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-mint">
                  Nova Assistant
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  Friendly, context-aware guidance to demystify DeFi concepts and help you ship strategies faster.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-slate-800/70 bg-slate-900/60 p-2 text-slate-400 transition hover:text-white"
                onClick={() => setOpen(false)}
                aria-label="Close Nova assistant"
              >
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="mt-6 space-y-4 rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4 text-sm text-slate-200">
              <div className="flex max-h-64 flex-col gap-4 overflow-y-auto pr-1">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={
                      message.role === "assistant"
                        ? "flex items-start gap-3 text-slate-200"
                        : "flex flex-row-reverse items-start gap-3 text-right text-white"
                    }
                  >
                    <div
                      className={
                        message.role === "assistant"
                          ? "mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-mint/20 text-mint"
                          : "mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-200"
                      }
                    >
                      {message.role === "assistant" ? "N" : "You"}
                    </div>
                    <p className="rounded-2xl bg-slate-900/70 px-4 py-3 text-left text-sm text-slate-200">
                      {message.content}
                    </p>
                  </div>
                ))}
                {isLoading ? (
                  <div className="flex items-start gap-3 text-slate-400">
                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-mint/20 text-mint">N</div>
                    <p className="rounded-2xl bg-slate-900/70 px-4 py-3 text-left text-sm text-slate-400">
                      Nova is thinking...
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-3">
                {starterPrompts.map((prompt) => (
                  <Button
                    key={prompt}
                    variant="secondary"
                    className="rounded-full bg-slate-900/80 px-4 py-2 text-xs"
                    onClick={() => handleStarterPrompt(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
            <form className="mt-6" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="nova-question">
                Ask Nova a question
              </label>
              <div className="flex items-center gap-3 rounded-full border border-slate-800/70 bg-slate-950/80 px-4 py-2">
                <input
                  id="nova-question"
                  type="text"
                  placeholder="Type your DeFi question..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  disabled={isLoading}
                  ref={inputRef}
                />
                <Button type="submit" variant="gradient" className="px-4 py-2 text-xs" disabled={isLoading}>
                  Send
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
