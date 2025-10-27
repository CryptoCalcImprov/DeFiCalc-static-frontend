import clsx from "clsx";

import { Button } from "@/components/ui/button";
import { heroStrategies, insightHighlights } from "@/lib/site-content";

const riskToneClasses = {
  low: "bg-mint/18 text-mint ring-1 ring-inset ring-mint/35",
  medium: "bg-primary/18 text-primary ring-1 ring-inset ring-primary/35",
  high: "bg-lavender/20 text-lavender ring-1 ring-inset ring-lavender/35"
} as const;

export function HeroSection() {
  return (
    <section
      id="overview"
      className="relative overflow-hidden border-b border-slate-900/60 bg-hero-grid"
    >
      {/* Base gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-900/40 via-background/90 to-background" aria-hidden />
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-16 px-6 py-24 lg:flex-row lg:items-center">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-mint/30 bg-slate-900/60 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-mint">
            DeFi onboarding made friendly
          </div>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl">
            Make sharper DeFi moves with live market, protocol, and risk analytics in one place.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-300">
            DeFiCalc distills on-chain noise into actionable signals for newcomers and power users alike. Compare
            opportunities, monitor strategies, and collaborate on calculators without leaving your dashboard.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button href="#markets" variant="gradient">
              Explore Dashboard
            </Button>
            <Button href="#protocols" variant="secondary">
              View Market Data
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-3 text-sm text-slate-300">
            {insightHighlights.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-900/80 px-4 py-1"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-mint" aria-hidden />
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="flex w-full flex-1 justify-end lg:justify-center">
          <div className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-950 p-6 shadow-2xl shadow-cyan-500/10">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">Strategy Monitor</p>
                <p className="text-xs text-slate-500">Live updates after wallet connection</p>
              </div>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300">Auto-refresh</span>
            </div>
            <ul className="space-y-4">
              {heroStrategies.map((strategy) => (
                <li
                  key={strategy.name}
                  className="rounded-2xl border border-slate-800/60 bg-slate-900 p-4 shadow-inner shadow-black/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{strategy.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        {strategy.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-slate-900/80 px-2.5 py-1">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span
                      className={clsx(
                        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                        riskToneClasses[strategy.riskTone]
                      )}
                    >
                      {strategy.riskLevel}
                    </span>
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-4 text-xs text-slate-300">
                    <div>
                      <dt className="uppercase tracking-widest text-slate-500">Net APR</dt>
                      <dd className="mt-1 text-base font-semibold text-mint">{strategy.netApr}</dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-widest text-slate-500">Rewards</dt>
                      <dd className="mt-1 text-sm text-white">{strategy.rewards}</dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-widest text-slate-500">Health</dt>
                      <dd className="mt-1 text-sm text-white">{strategy.health}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 h-2 w-full rounded-full bg-slate-900">
                    <div
                      className="h-full rounded-full bg-mint"
                      style={{ width: `${strategy.health}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
