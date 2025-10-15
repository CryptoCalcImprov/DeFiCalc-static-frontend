import { Button } from "@/components/ui/button";
import { heroHighlights, heroStrategies } from "@/lib/site-content";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-slate-900 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-hero-grid bg-[length:120px_120px] opacity-40" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-12 px-6 py-24 lg:flex-row lg:items-center lg:gap-20">
        <div className="flex-1">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
            Defi Intelligence
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Make sharper DeFi moves with live market, protocol, and risk analytics in one place.
          </h1>
          <p className="mt-6 text-lg text-slate-300">
            DeFiCalc.io distills on-chain noise into actionable insight—monitor TVL shifts, model yield loops, and share dashboards with your entire team.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button className="bg-gradient-to-r from-primary via-emerald-400 to-accent text-slate-950 shadow-glow hover:from-primary/90 hover:via-emerald-400/90 hover:to-accent/90">
              Explore Dashboard
            </Button>
            <Button href="#markets" variant="ghost" className="border border-transparent px-4 py-2 text-slate-200 hover:border-slate-800 hover:bg-slate-900/80">
              View Market Data
            </Button>
          </div>
          <dl className="mt-12 grid gap-6 text-sm text-slate-200 sm:grid-cols-3">
            {heroHighlights.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-5">
                <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">{item.title}</dt>
                <dd className="mt-3 text-sm text-slate-300">{item.description}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative flex w-full flex-1 justify-end">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/80 p-6 shadow-2xl backdrop-blur">
            <div className="absolute -left-24 -top-24 h-48 w-48 rounded-full bg-glow-ring opacity-60 blur-2xl" />
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
              <span>Strategy Monitor</span>
              <span>Synced 3 mins ago</span>
            </div>
            <div className="mt-6 space-y-4">
              {heroStrategies.map((strategy) => (
                <div key={strategy.name} className="rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-4">
                  <div className="flex items-center justify-between text-sm text-slate-200">
                    <span className="font-semibold text-white">{strategy.name}</span>
                    <span className="text-xs uppercase tracking-[0.3em] text-slate-500">{strategy.metric}</span>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <span className="text-3xl font-semibold text-white">{strategy.value}</span>
                    <span className="text-sm font-medium text-emerald-400">{strategy.change}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <span>Portfolio TVL</span>
                <span className="text-base font-semibold text-white">$1.52M</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Projected APY</span>
                <span className="text-base font-semibold text-white">18.7%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Risk Score</span>
                <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-xs font-semibold text-emerald-300">Balanced</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
