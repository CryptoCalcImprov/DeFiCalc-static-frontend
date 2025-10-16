"use client";

import { useId, useState } from "react";

import { novaSuggestions } from "@/lib/site-content";

export function NovaAssistantLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:scale-[1.02] sm:bottom-6"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? titleId : undefined}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">N</span>
        Ask Nova
      </button>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 backdrop-blur-sm sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative m-4 w-full max-w-md rounded-3xl border border-slate-800/70 bg-midnight/90 p-6 text-left shadow-card"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p id={titleId} className="text-base font-semibold text-white">
                  Nova · Conversational DeFi guide
                </p>
                <p className="text-xs text-slate-400">Real-time answers coming soon.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700/70 text-slate-300 transition hover:text-white"
                aria-label="Close Nova panel"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="mt-6 space-y-4 text-sm text-slate-200">
              <div className="rounded-2xl border border-slate-800/70 bg-midnight/70 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Sample response</p>
                <p className="mt-2 text-sm text-slate-200">
                  “Watch Curve’s gauge vote closing in 6h; the boosted pool moves APR from 5.4% to 6.1%. I’ll ping you once the vote
                  finalizes.”
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Try asking</p>
                {novaSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="w-full rounded-2xl border border-slate-800/70 bg-midnight/70 px-4 py-3 text-left text-sm text-slate-300 transition hover:border-secondary hover:text-white"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-slate-800/70 bg-midnight/70 p-4 text-xs text-slate-400">
              Nova launches with read-only insights and expands into transactions as the calculator engine comes online.
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
