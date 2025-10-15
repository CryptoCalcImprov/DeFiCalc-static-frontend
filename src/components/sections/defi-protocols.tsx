import { protocolLeaders } from "@/lib/site-content";

export function DefiProtocolsSection() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {protocolLeaders.map((protocol) => (
        <article
          key={protocol.name}
          className="flex h-full flex-col justify-between rounded-3xl border border-slate-900/70 bg-slate-950/80 p-6 shadow-lg shadow-slate-950/50"
        >
          <div>
            <span className="inline-flex items-center rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              {protocol.category}
            </span>
            <h3 className="mt-5 text-xl font-semibold text-white">{protocol.name}</h3>
            <p className="mt-2 text-sm text-slate-400">{protocol.chain}</p>
          </div>
          <div className="mt-8 space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>TVL</span>
              <span className="text-lg font-semibold text-white">{protocol.tvl}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>24h Change</span>
              <span className="font-medium text-emerald-400">{protocol.change}</span>
            </div>
            <div className="rounded-2xl border border-slate-900 bg-slate-950/70 px-4 py-3 text-xs text-slate-400">
              Governance vote closes in 3 days · New collateral listing proposed.
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
