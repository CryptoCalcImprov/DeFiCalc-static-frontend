"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

const starterPrompts = [
  "How can I calculate yield?",
  "Explain TVL vs APY",
  "Show safe ETH strategies"
];

export function NovaAssistant() {
  const [open, setOpen] = useState(false);

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
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-mint/20 text-mint">N</div>
                <p>
                  Hi! Ask me about strategy health, projected yields, or how to model a position in the Calculator Sandbox.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {starterPrompts.map((prompt) => (
                  <Button key={prompt} variant="secondary" className="rounded-full bg-slate-900/80 px-4 py-2 text-xs" onClick={() => setOpen(false)}>
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
            <form className="mt-6">
              <label className="sr-only" htmlFor="nova-question">
                Ask Nova a question
              </label>
              <div className="flex items-center gap-3 rounded-full border border-slate-800/70 bg-slate-950/80 px-4 py-2">
                <input
                  id="nova-question"
                  type="text"
                  placeholder="Type your DeFi question..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                />
                <Button type="submit" variant="gradient" className="px-4 py-2 text-xs">
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
