import clsx from "clsx";
import { protocolFilters, protocolLeaders } from "@/lib/site-content";

export function ProtocolLeadersSection() {
  return (
    <section id="protocols" className="border-b border-slate-900 bg-brand-deep py-20">
      <div className="mx-auto max-w-6xl px-6">
        <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
              Protocol leaders
            </span>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              Familiar tables, deeper signals.
            </h2>
            <p className="text-base text-slate-300">
              Sort by TVL, growth, governance activity or chain. Cards expand into analytics dashboards while keeping the layout comfortable for CoinMarketCap and CoinGecko power users.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <button className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-4 py-2 transition hover:border-primary hover:text-white">
              Sort: TVL high → low
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8M8 12h5M8 17h2" />
              </svg>
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-4 py-2 transition hover:border-primary hover:text-white">
              Governance signals
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m12 19 7-7-7-7" />
              </svg>
            </button>
          </div>
        </header>
        <div className="mb-8 flex flex-wrap items-center gap-3">
          {protocolFilters.map((filter) => (
            <button
              key={filter}
              className={clsx(
                "rounded-full border px-4 py-1.5 text-xs font-semibold transition",
                filter === "All"
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-slate-800 bg-brand-navy/50 text-slate-300 hover:border-primary/40 hover:text-white"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {protocolLeaders.map((protocol) => (
            <article
              key={protocol.name}
              className="group relative flex flex-col gap-5 rounded-3xl border border-slate-900/70 bg-brand-navy/50 p-6 shadow-card transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-glow"
            >
              {protocol.governance.startsWith("Sponsored") ? (
                <span className="absolute right-6 top-6 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-accent">
                  Sponsored
                </span>
              ) : null}
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-midnight text-sm font-semibold text-primary">
                  {protocol.symbol}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{protocol.name}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-midnight/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-brand-teal">
                      {protocol.chain}
                    </span>
                    <span className="text-slate-500">{protocol.category}</span>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 rounded-2xl border border-slate-900/70 bg-brand-midnight/70 p-4 text-sm text-slate-400">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-slate-500">
                  <span>TVL</span>
                  <span className={protocol.sentiment === "up" ? "text-brand-teal" : "text-danger"}>{protocol.change24h}</span>
                </div>
                <p className="text-2xl font-semibold text-white">{protocol.tvl}</p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Governance</span>
                  <span className="text-right text-[11px] text-slate-300">{protocol.governance}</span>
                </div>
              </div>
              <button className="inline-flex items-center gap-2 text-xs font-semibold text-primary transition hover:text-brand-aqua">
                Open protocol dashboard
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m7 17 9-9m0 0h-6m6 0v6" />
                </svg>
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
