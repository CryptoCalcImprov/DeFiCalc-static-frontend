import clsx from "clsx";

import { Button } from "@/components/ui/button";
import { strategyMonitor } from "@/lib/site-content";

const riskBadgeStyles: Record<string, string> = {
  Safe: "bg-emerald-500/20 text-emerald-200",
  Balanced: "bg-blue-500/20 text-blue-200",
  Growth: "bg-purple-500/20 text-purple-200"
};

export function HeroSection() {
  return (
    <section
      id="overview"
      className="relative overflow-hidden border-b border-slate-900/70 bg-gradient-to-br from-midnight via-[#061022] to-[#081832]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(109,74,255,0.15),transparent_55%)]" aria-hidden="true" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-14 px-6 py-24 lg:flex-row lg:items-center">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-midnight-300/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-primary/80">
            DeFi intelligence hub
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
            Make sharper DeFi moves with live market, protocol, and risk analytics in one place.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-300">
            DeFiCalc distills on-chain noise into actionable insights for both newcomers and seasoned strategists. Explore curated
            strategies, monitor governance, and build calculators that adapt as fast as the market.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button href="#markets" variant="gradient" className="rounded-full px-6 py-3">
              Explore Dashboard
            </Button>
            <Button href="#markets" variant="outline" className="rounded-full px-6 py-3">
              View Market Data
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
              Live metrics refresh every 5 minutes post-integration
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-sky-400" aria-hidden="true" />
              Friendly copy and tooltips keep DeFi approachable
            </div>
          </div>
        </div>
        <StrategyMonitorWidget />
      </div>
    </section>
  );
}

function StrategyMonitorWidget() {
  return (
    <aside className="w-full max-w-md flex-1 rounded-3xl border border-slate-800/70 bg-midnight-200/40 p-6 shadow-card backdrop-blur">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Strategy monitor</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Curated plays to watch</h2>
        </div>
        <div className="rounded-full border border-slate-700/80 bg-midnight-300/30 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-400">
          Live soon
        </div>
      </header>
      <ul className="mt-6 space-y-4">
        {strategyMonitor.map((strategy) => (
          <li key={strategy.name} className="rounded-2xl border border-slate-800/60 bg-midnight/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{strategy.name}</p>
                <p className="text-xs text-slate-400">{strategy.status}</p>
              </div>
              <span
                className={clsx(
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                  riskBadgeStyles[strategy.tag] ?? "bg-slate-500/20 text-slate-200"
                )}
              >
                {strategy.tag}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-xs text-slate-300">
              <div>
                <dt className="uppercase tracking-[0.2em] text-slate-500">Net APR</dt>
                <dd className="mt-1 text-base font-semibold text-emerald-300">{strategy.netApr}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.2em] text-slate-500">Rewards</dt>
                <dd className="mt-1 text-base font-semibold text-sky-200">{strategy.rewards}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.2em] text-slate-500">Health</dt>
                <dd className="mt-1 flex items-center gap-1 text-base font-semibold text-white">
                  {strategy.health}
                  <span className="text-xs text-slate-400">/100</span>
                </dd>
              </div>
            </dl>
            <div className="mt-3 h-2 rounded-full bg-slate-800/80">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-secondary"
                style={{ width: `${strategy.health}%` }}
                aria-hidden="true"
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-slate-500">
        Strategies update automatically once analytics integrations go live. Pin your favourites to receive Nova summaries.
      </p>
    </aside>
  );
}
