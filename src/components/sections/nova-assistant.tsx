"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { novaSuggestions } from "@/lib/site-content";

export function NovaAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-20 z-40 flex flex-col items-end gap-3 sm:right-6">
      {isOpen ? (
        <div className="w-80 rounded-3xl border border-slate-800/70 bg-abyss/95 p-5 text-sm text-slate-200 shadow-panel">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-accent">Nova AI</p>
              <h3 className="mt-2 text-lg font-semibold text-white">How can I help?</h3>
              <p className="mt-2 text-xs text-slate-400">
                Ask Nova to explain concepts, surface opportunities or outline risks. Voice input and live data coming soon.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full border border-slate-700/70 p-2 text-slate-400 transition hover:border-slate-500 hover:text-white"
            >
              <span className="sr-only">Close Nova panel</span>
              ×
            </button>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            {novaSuggestions.map((suggestion) => (
              <li key={suggestion} className="rounded-xl border border-slate-800/60 bg-slate-900/60 px-3 py-2">
                “{suggestion}”
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Button variant="gradient" className="w-full justify-center" href="mailto:nova@deficalc.io">
              Request Nova access
            </Button>
          </div>
        </div>
      ) : null}
      <Button
        variant="gradient"
        className="px-5 py-3 text-base shadow-panel"
        onClick={() => setIsOpen((value) => !value)}
      >
        {isOpen ? "Hide Nova" : "Ask Nova"}
      </Button>
    </div>
  );
}
