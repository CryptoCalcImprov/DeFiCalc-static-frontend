import clsx from "clsx";

import { marketPulseMetrics } from "@/lib/site-content";

export function MarketPulseSection() {
  return (
    <section id="markets" className="border-b border-slate-900/70 bg-midnight/60 py-14">
      <div className="mx-auto max-w-6xl px-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Market pulse</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Live snapshots across the DeFi universe</h2>
          </div>
          <p className="text-sm text-slate-400 sm:max-w-md">
            Filterable metrics for TVL, volume, and risk alerts. Charts animate on hover and expand into full dashboards inside the
            app.
          </p>
        </header>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {marketPulseMetrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-2xl border border-slate-800/70 bg-gradient-to-br from-midnight-200/50 via-midnight/50 to-midnight-300/30 p-5 shadow-card"
            >
              <header className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                <span>{metric.label}</span>
                <span className="text-[10px] text-slate-500">{metric.descriptor}</span>
              </header>
              <p className="mt-5 text-3xl font-semibold text-white">{metric.value}</p>
              <p
                className={clsx(
                  "mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                  metric.change > 0
                    ? "bg-emerald-500/15 text-emerald-200"
                    : metric.change < 0
                    ? "bg-rose-500/15 text-rose-200"
                    : "bg-slate-600/20 text-slate-300"
                )}
              >
                {metric.change > 0 ? "▲" : metric.change < 0 ? "▼" : "•"} {Math.abs(metric.change)}%
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
