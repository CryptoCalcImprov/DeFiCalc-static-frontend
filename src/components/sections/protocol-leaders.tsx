import clsx from "clsx";

import { protocolFilters, protocolLeaders } from "@/lib/site-content";

const changeStyles = {
  up: "text-mint",
  down: "text-lavender"
} as const;

export function ProtocolLeadersSection() {
  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest text-slate-400">
          <span className="rounded-full bg-slate-900/70 px-3 py-1 text-slate-200">Sort</span>
          {protocolFilters.sortOptions.map((option) => (
            <button
              key={option}
              type="button"
              className="rounded-full border border-slate-800/70 bg-slate-900/60 px-4 py-1.5 text-slate-200 transition hover:border-mint/60 hover:text-white"
            >
              {option}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-300">
          {protocolFilters.categories.map((category) => (
            <span key={category} className="rounded-full bg-slate-900/80 px-3 py-1">
              {category}
            </span>
          ))}
          <span className="rounded-full border border-slate-800/70 bg-slate-900/60 px-3 py-1 text-slate-400">
            Chains: {protocolFilters.chains.join(", ")}
          </span>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {protocolLeaders.map((protocol) => (
          <article key={protocol.name} className="group relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-950 p-6 shadow-lg shadow-black/20 transition hover:border-mint/50">
            {'sponsored' in protocol && protocol.sponsored ? (
              <span className="absolute right-4 top-4 rounded-full bg-lavender/20 px-3 py-1 text-xs font-semibold text-lavender">
                Sponsored
              </span>
            ) : null}
            <header className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{protocol.name}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="rounded-full border border-slate-800/70 bg-slate-900/60 px-2.5 py-1 text-slate-200">
                    {protocol.chain}
                  </span>
                  <span className="rounded-full bg-slate-900/70 px-2.5 py-1">{protocol.category}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-slate-500">24h</span>
                <span className={clsx("flex items-center gap-1 text-sm font-semibold", changeStyles[protocol.changeDirection])}>
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden
                  >
                    {protocol.changeDirection === "up" ? (
                      <path d="M3 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
                    ) : (
                      <path d="M3 7l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                  </svg>
                  {protocol.change24h}
                </span>
              </div>
            </header>
            <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm text-slate-300">
              <dt className="text-slate-500">TVL</dt>
              <dd className="font-semibold text-white">{protocol.tvl}</dd>
              <dt className="text-slate-500">Governance</dt>
              <dd className="text-slate-200">{protocol.governanceNote}</dd>
            </dl>
            <footer className="mt-6 flex items-center justify-between text-xs text-slate-400">
              <span>Click for protocol deep-dive</span>
              <span className="inline-flex items-center gap-1 text-mint">
                View details
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 3l6 5-6 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}
