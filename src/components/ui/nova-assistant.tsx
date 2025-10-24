"use client";

import { FormEvent, MouseEvent, useState } from "react";

import { Button } from "@/components/ui/button";

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

const NOVA_TEXT_KEYS = [
  "message",
  "output",
  "result",
  "response",
  "data",
  "content",
  "text",
  "error",
  "details",
] as const;

function extractFirstText(payload: unknown): string | undefined {
  const visited = new WeakSet<object>();

  const walk = (value: unknown): string | undefined => {
    if (value === null || value === undefined) {
      return undefined;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed ? trimmed : undefined;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return value.toString();
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const result = walk(item);
        if (result) {
          return result;
        }
      }
      return undefined;
    }

    if (typeof value !== "object") {
      return undefined;
    }

    const objectValue = value as Record<string, unknown>;

    if (visited.has(objectValue)) {
      return undefined;
    }

    visited.add(objectValue);

    for (const key of NOVA_TEXT_KEYS) {
      if (key in objectValue) {
        const result = walk(objectValue[key]);
        if (result) {
          return result;
        }
      }
    }

    for (const entry of Object.values(objectValue)) {
      const result = walk(entry);
      if (result) {
        return result;
      }
    }

    return undefined;
  };

  return walk(payload);
}

const starterPrompts = [
  "How can I calculate yield?",
  "Explain TVL vs APY",
  "Show safe ETH strategies",
];

export function NovaAssistant() {
  const [open, setOpen] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! Ask me about strategy health, projected yields, or how to model a position in the Calculator Sandbox.",
    },
  ]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement> | MouseEvent<HTMLButtonElement>,
    promptOverride?: string,
  ) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const submittedPrompt = (promptOverride ?? promptText).trim();

    if (!submittedPrompt) {
      setError("Please enter a question for Nova before sending.");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_NOVA_API_URL?.replace(/\/$/, "");
    const apiKey = process.env.NEXT_PUBLIC_NOVA_API_KEY;

    if (!apiUrl || !apiKey) {
      setError("Nova configuration is missing. Set NEXT_PUBLIC_NOVA_API_URL and NEXT_PUBLIC_NOVA_API_KEY.");
      return;
    }

    const requestBody = {
      input: submittedPrompt,
      model: "gpt-5",
      temperature: 0.7,
      verbosity: "medium",
      max_tokens: 1024,
      reasoning: false,
      reasoning_params: null,
      image_urls: [] as string[],
    };

    setError(null);
    setIsLoading(true);
    setConversation((previous) => [...previous, { role: "user", content: submittedPrompt }]);
    setPromptText("");

    const fallbackMessage = "Nova didn't send a response. Please try again.";
    const fallbackError = "Nova couldn't complete that request. Please try again.";

    try {
      const response = await fetch(`${apiUrl}/ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      const rawText = await response.text();
      let parsedPayload: unknown = undefined;

      if (rawText) {
        try {
          parsedPayload = JSON.parse(rawText);
        } catch {
          parsedPayload = rawText;
        }
      }

      if (!response.ok) {
        const messageFromPayload = extractFirstText(parsedPayload) ?? fallbackError;
        setError(messageFromPayload);
        setConversation((previous) => [
          ...previous,
          { role: "assistant", content: messageFromPayload },
        ]);
        return;
      }

      const novaReply = extractFirstText(parsedPayload) ?? fallbackMessage;

      setConversation((previous) => [
        ...previous,
        { role: "assistant", content: novaReply },
      ]);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error && caughtError.message ? caughtError.message : fallbackError;
      setError(message);
      setConversation((previous) => [...previous, { role: "assistant", content: message }]);
    } finally {
      setIsLoading(false);
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
          <div
            className="absolute inset-0"
            onClick={() => {
              if (!isLoading) {
                setOpen(false);
              }
            }}
            aria-hidden
          />
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
                className="rounded-full border border-slate-800/70 bg-slate-900/60 p-2 text-slate-400 transition hover:text-white disabled:opacity-50"
                onClick={() => setOpen(false)}
                aria-label="Close Nova assistant"
                disabled={isLoading}
              >
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="mt-6 space-y-4 rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4 text-sm text-slate-200">
              <div className="space-y-4" aria-live="polite">
                {conversation.map((message, index) => (
                  <div
                    key={`${message.role}-${index}-${message.content.slice(0, 16)}`}
                    className={
                      message.role === "assistant"
                        ? "flex items-start gap-3"
                        : "flex items-start justify-end gap-3"
                    }
                  >
                    {message.role === "assistant" ? (
                      <>
                        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-mint/20 text-mint">
                          N
                        </div>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </>
                    ) : (
                      <>
                        <p className="max-w-[80%] rounded-2xl bg-mint/10 px-4 py-3 text-right text-sm text-white">
                          {message.content}
                        </p>
                        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-200">
                          You
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {isLoading ? (
                  <div className="flex items-start gap-3 text-slate-400">
                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-mint/20 text-mint">
                      N
                    </div>
                    <p>Nova is thinking...</p>
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-3">
                {starterPrompts.map((prompt) => (
                  <Button
                    key={prompt}
                    type="button"
                    variant="secondary"
                    className="rounded-full bg-slate-900/80 px-4 py-2 text-xs"
                    disabled={isLoading}
                    onClick={(event) => {
                      void handleSubmit(event, prompt);
                    }}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
            <form
              className="mt-6"
              onSubmit={(event) => {
                void handleSubmit(event);
              }}
            >
              <label className="sr-only" htmlFor="nova-question">
                Ask Nova a question
              </label>
              <div className="flex items-center gap-3 rounded-full border border-slate-800/70 bg-slate-950/80 px-4 py-2">
                <input
                  id="nova-question"
                  type="text"
                  placeholder="Type your DeFi question..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed"
                  value={promptText}
                  onChange={(event) => setPromptText(event.target.value)}
                  disabled={isLoading}
                />
                <Button type="submit" variant="gradient" className="px-4 py-2 text-xs" disabled={isLoading}>
                  {isLoading ? "Sending" : "Send"}
                </Button>
              </div>
              {error ? (
                <p className="mt-2 text-xs text-rose-400" role="alert">
                  {error}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
