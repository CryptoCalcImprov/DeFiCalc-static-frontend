import clsx from "clsx";

import { Button } from "@/components/ui/button";
import { protocolFilters, protocolLeaders } from "@/lib/site-content";

const riskAccent: Record<string, string> = {
  Safe: "text-emerald-200",
  Balanced: "text-sky-200",
  Growth: "text-purple-200"
};

const chipAccent: Record<string, string> = {
  Ethereum: "from-[#627EEA]/20 to-[#3A56C4]/20",
  "Multi-chain": "from-[#14B8A6]/20 to-[#0EA5E9]/20",
  Arbitrum: "from-[#2D3CDC]/20 to-[#38BDF8]/20"
};

export function ProtocolLeadersSection() {
  return (
    <section id="protocols" className="border-b border-slate-900/70 bg-midnight/70 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Protocol leaders</p>
            <h2 className="text-3xl font-semibold text-white">Discover top-performing protocols and governance signals.</h2>
            <p className="text-sm text-slate-400">
              Sort by TVL, growth, chain, or governance events. Sponsored cards are highlighted but maintain parity with the core
              design language.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {protocolFilters.map((filter) => (
              <button
                type="button"
                key={filter}
                className="rounded-full border border-slate-700/60 bg-midnight-300/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                {filter}
              </button>
            ))}
          </div>
        </header>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {protocolLeaders.map((protocol) => (
            <article
              key={protocol.name}
              className={clsx(
                "relative flex h-full flex-col justify-between rounded-3xl border border-slate-800/70 bg-midnight-200/40 p-6 shadow-card",
                protocol.sponsored && "ring-1 ring-offset-2 ring-offset-midnight ring-accent/40"
              )}
            >
              {protocol.sponsored ? (
                <span className="absolute right-6 top-6 rounded-full bg-accent/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-accent-foreground">
                  Sponsored
                </span>
              ) : null}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{protocol.name}</h3>
                    <span
                      className={clsx(
                        "inline-flex items-center rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-medium text-slate-100",
                        chipAccent[protocol.chain] ?? "from-slate-600/30 to-slate-700/30"
                      )}
                    >
                      {protocol.chain}
                    </span>
                  </div>
                  <span className="rounded-full border border-slate-700/60 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                    {protocol.category}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">TVL</p>
                    <p className="mt-1 text-xl font-semibold text-white">{protocol.tvl}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">24h change</p>
                    <p
                      className={clsx(
                        "mt-1 text-xl font-semibold",
                        protocol.change >= 0 ? "text-emerald-300" : "text-rose-300"
                      )}
                    >
                      {protocol.change >= 0 ? "+" : ""}
                      {protocol.change}%
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-400">{protocol.governanceNote}</p>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-slate-800/70 pt-4 text-xs text-slate-400">
                <span>Risk level</span>
                <span className={clsx("font-semibold", riskAccent[protocol.risk] ?? "text-slate-200")}>{protocol.risk}</span>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800/60 bg-midnight/60 p-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Want your protocol featured?</h3>
            <p className="text-sm text-slate-400">
              Collaborate on educational spotlights or advertiser placements that blend seamlessly with DeFiCalc’s design.
            </p>
          </div>
          <Button href="mailto:partners@deficalc.io" variant="gradient" className="rounded-full px-6 py-3">
            Book a spotlight
          </Button>
        </div>
      </div>
    </section>
  );
}
