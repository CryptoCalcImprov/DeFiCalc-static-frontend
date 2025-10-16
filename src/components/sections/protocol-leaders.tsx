import { protocolFilters, protocolLeaders } from "@/lib/site-content";

function getChangeColor(value: number) {
  if (value > 0) return "text-success";
  if (value < 0) return "text-danger";
  return "text-slate-300";
}

export function ProtocolLeadersSection() {
  return (
    <section
      id="protocols"
      className="border-b border-slate-800/60 bg-gradient-to-b from-deep via-abyss/70 to-midnight py-20"
      aria-labelledby="protocol-leaders-title"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <h2 id="protocol-leaders-title" className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Protocol leaders
            </h2>
            <p className="text-base text-slate-300">
              Familiar card-based dashboards inspired by CoinMarketCap and CoinGecko, evolved with richer spacing and governance
              cues. Sort, filter and surface the protocols worth your attention.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {protocolFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                className="rounded-full border border-slate-700/70 bg-slate-900/40 px-4 py-2 font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-accent/60 hover:text-white"
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {protocolLeaders.map((protocol) => (
            <article
              key={protocol.name}
              className="group relative overflow-hidden rounded-3xl border border-slate-800/70 bg-abyss/80 p-6 shadow-panel transition hover:-translate-y-1"
            >
              {protocol.sponsored ? (
                <span className="absolute right-4 top-4 rounded-full border border-highlight/60 bg-highlight/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-highlight">
                  Sponsored
                </span>
              ) : null}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/40 to-accent/30 text-lg font-semibold text-white">
                  {protocol.name[0]}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{protocol.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="rounded-full border border-slate-700/60 bg-slate-900/60 px-2 py-0.5 uppercase tracking-[0.3em]">
                      {protocol.chain}
                    </span>
                    <span>{protocol.category}</span>
                  </div>
                </div>
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-200">
                <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4">
                  <dt className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Total value locked</dt>
                  <dd className="mt-2 text-xl font-semibold text-white">{protocol.tvl}</dd>
                </div>
                <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4">
                  <dt className="text-[11px] uppercase tracking-[0.3em] text-slate-500">24h change</dt>
                  <dd className={`mt-2 flex items-center gap-1 text-lg font-semibold ${getChangeColor(protocol.change24h)}`}>
                    <span>{protocol.change24h > 0 ? "▲" : protocol.change24h < 0 ? "▼" : "■"}</span>
                    <span>{Math.abs(protocol.change24h).toFixed(1)}%</span>
                  </dd>
                </div>
              </dl>
              <p className="mt-6 text-xs text-slate-400">{protocol.governanceNote}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
