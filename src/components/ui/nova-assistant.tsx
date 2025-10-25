"use client";

import { FormEvent, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/components/ui/chat-message";
import { StarterPrompts } from "@/components/ui/starter-prompts";
import { ThinkingIndicator } from "@/components/ui/thinking-indicator";

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

    const baseUrl =
      process.env.NODE_ENV !== "development" ? process.env.NEXT_PUBLIC_NOVA_API_URL?.trim() : undefined;
    let requestUrl = "/ai";

    if (baseUrl) {
      const sanitized = baseUrl.endsWith("/ai") ? baseUrl : `${baseUrl.replace(/\/$/, "")}/ai`;
      requestUrl = sanitized;
    }

    try {
      const parsedUrl = new URL(
        requestUrl,
        requestUrl.startsWith("http") ? undefined : typeof window !== "undefined" ? window.location.origin : undefined,
      );
      requestUrl = parsedUrl.toString();
    } catch (error) {
      // Ignore parse errors and fall back to the original requestUrl
    }

    const headers = new Headers({
      "Content-Type": "application/json",
    });

    const apiKey = process.env.NEXT_PUBLIC_NOVA_API_KEY?.trim();
    if (apiKey) {
      headers.set("Authorization", `Bearer ${apiKey}`);
    }

    const body = {
      input: prompt,
      model: "gpt-5-mini",
      temperature: 0.7,
      verbosity: "medium",
      max_tokens: 2000,
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

      const contentType = response.headers.get("content-type") ?? "";
      const rawBody = await response.text();
      let assistantReply = "";

      if (contentType.includes("application/json")) {
        try {
          const data = rawBody ? JSON.parse(rawBody) : null;
          assistantReply =
            data?.output ??
            data?.message ??
            data?.content ??
            data?.reply ??
            data?.text ??
            data?.choices?.[0]?.message?.content ??
            (typeof data === "string" ? data : data ? JSON.stringify(data) : "");
        } catch (jsonError) {
          assistantReply = rawBody;
        }
      } else {
        assistantReply = rawBody;
      }

      const resolvedReply = typeof assistantReply === "string" ? assistantReply : String(assistantReply ?? "");
      const trimmedReply = resolvedReply.trim();

      if (!response.ok) {
        throw new Error(trimmedReply || rawBody || `Nova responded with status ${response.status}`);
      }

      if (!trimmedReply) {
        console.warn("Nova returned an empty response payload.", {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          rawBody,
        });
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "I didn't receive any text back from Nova. Please try again." },
        ]);
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: resolvedReply }]);
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
        <div className="fixed inset-0 z-50 flex justify-center md:items-end md:justify-end bg-black/40 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setOpen(false)} aria-hidden />
          <div className="relative flex h-full min-h-0 w-full max-w-none flex-col overflow-hidden rounded-none border border-slate-800/70 bg-surface/95 p-4 shadow-2xl md:h-[80vh] md:max-h-[80vh] md:max-w-2xl md:rounded-3xl md:p-6 md:mr-8 md:mb-8">
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
            <div className="mt-6 flex flex-1 min-h-0 flex-col rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4 text-sm text-slate-200">
              <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto pr-1 nova-scroll">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={`${message.role}-${index}`}
                    role={message.role}
                    content={message.content}
                  />
                ))}
                {isLoading ? <ThinkingIndicator /> : null}
              </div>
              {messages.length === 1 ? (
                <StarterPrompts prompts={starterPrompts} onPromptClick={handleStarterPrompt} />
              ) : null}
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
