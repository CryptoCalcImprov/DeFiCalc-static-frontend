"use client";

import { useState } from "react";
import clsx from "clsx";
import { insightPrompts } from "@/lib/site-content";

export function NovaAssistant() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div className="w-80 rounded-3xl border border-slate-900/70 bg-brand-midnight/95 p-4 text-slate-200 shadow-glow backdrop-blur">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                N
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Nova assistant</p>
                <p className="text-[11px] text-slate-400">Beta preview • Hooks into analytics cards soon</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-800 text-slate-400 transition hover:border-primary hover:text-white"
              aria-label="Minimize Nova panel"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12" />
              </svg>
            </button>
          </header>
          <div className="mt-4 space-y-3 text-sm">
            <p className="text-slate-300">
              Ask Nova anything about the data on this page. Once integrated, the assistant can pull metrics directly from the card you’re viewing and build calculators with you.
            </p>
            <ul className="space-y-2 text-xs text-slate-200">
              {insightPrompts.map((prompt) => (
                <li
                  key={prompt}
                  className="rounded-2xl border border-slate-800/70 bg-brand-navy/60 px-3 py-2 transition hover:border-primary/40 hover:text-white"
                >
                  “{prompt}”
                </li>
              ))}
            </ul>
            <button className="w-full rounded-full bg-gradient-to-r from-primary to-brand-teal px-4 py-2 text-sm font-semibold text-brand-midnight shadow-glow transition hover:shadow-lg hover:shadow-brand-teal/40">
              Start conversation
            </button>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={clsx(
          "inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 py-2.5 text-sm font-semibold",
          "text-primary shadow-glow transition hover:border-primary hover:text-white"
        )}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m5 19 2-6-3-3 4-.3L12 4l4 5.7 4 .3-3 3 2 6-5.4-3.2L12 21l-1.6-5.2z" />
        </svg>
        Ask Nova
      </button>
    </div>
  );
}
