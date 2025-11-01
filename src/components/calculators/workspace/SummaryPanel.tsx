"use client";

import { MessageParser } from "@/components/ui/message-parser";
import { CalculatorSpinner } from "@/components/calculators/workspace/CalculatorSpinner";

type SummaryPanelProps = {
  title?: string;
  lines: string[];
  emptyMessage?: string;
  isLoading?: boolean;
  loadingMessage?: string;
};

export function SummaryPanel({
  title = "Nova’s takeaway",
  lines,
  emptyMessage = "No summary available for this run.",
  isLoading = false,
  loadingMessage = "Awaiting Nova’s projection...",
}: SummaryPanelProps) {
  const hasLines = lines.length > 0;

  return (
    <div className="card-surface-muted flex h-full flex-col gap-4 rounded-2xl bg-gradient-to-br from-slate-950/65 via-slate-950/45 to-slate-900/24 p-4 shadow-[0_10px_32px_rgba(6,21,34,0.32)] sm:gap-5 sm:rounded-3xl sm:p-6">
      <div className="flex h-full flex-col">
        <h3 className="text-lg font-semibold text-slate-50 sm:text-xl">{title}</h3>
        <div className="mt-3 flex flex-1 sm:mt-4">
          <div className="flex-1 rounded-2xl border border-ocean/65 bg-surface/80 p-4 shadow-inner shadow-[0_0_28px_rgba(7,24,36,0.22)] sm:p-5">
            {isLoading ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <CalculatorSpinner />
                <p className="text-xs font-semibold uppercase tracking-widest text-mint/80 sm:text-sm">
                  Nova is modeling…
                </p>
                <p className="max-w-xs text-xs text-slate-300 sm:text-sm">{loadingMessage}</p>
              </div>
            ) : (
              <ul className="space-y-2 text-xs leading-relaxed text-muted sm:space-y-3 sm:text-sm">
                {hasLines
                  ? lines.map((line, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span
                          className="mt-1 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-mint shadow-[0_0_8px_rgba(58,198,255,0.65)]"
                          aria-hidden
                        />
                        <MessageParser content={line} className="flex-1" />
                      </li>
                    ))
                  : (
                    <li className="text-muted">{emptyMessage}</li>
                  )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
