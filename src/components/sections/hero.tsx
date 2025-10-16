import { Button } from "@/components/ui/button";
import { heroHighlights } from "@/lib/site-content";

import { StrategyMonitor } from "./strategy-monitor";

export function HeroSection() {
  return (
    <section id="overview" className="relative overflow-hidden border-b border-slate-800/70 bg-gradient-to-b from-abyss via-midnight to-deep">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-3xl" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-16 px-6 py-24 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-accent">
            Community-led DeFi intelligence
          </div>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Make sharper DeFi moves with live market, protocol and risk analytics.
            </h1>
            <p className="text-lg text-slate-300">
              DeFiCalc distills on-chain noise into actionable insights so newcomers feel guided and experienced investors stay ahead. Explore digestible dashboards, curated strategies and Nova — your friendly DeFi co-pilot.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button href="#protocols" variant="gradient" className="px-6 py-3 text-base">
              Explore dashboard
            </Button>
            <Button href="#markets" variant="outline" className="px-6 py-3 text-base">
              View market data
            </Button>
          </div>
          <ul className="grid gap-4 text-sm text-slate-300 md:grid-cols-3">
            {heroHighlights.map((item) => (
              <li key={item.label} className="rounded-2xl border border-slate-800/60 bg-deep/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500">{item.label}</p>
                <p className="mt-2 text-sm text-slate-300">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex w-full flex-1 justify-end lg:justify-center">
          <StrategyMonitor />
        </div>
      </div>
    </section>
  );
}
