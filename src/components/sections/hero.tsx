import clsx from "clsx";
import { strategyMonitorEntries } from "@/lib/site-content";

export function HeroSection() {
  return (
    <section id="overview" className="relative overflow-hidden border-b border-slate-900 bg-hero-gradient">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-20 top-40 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-brand-teal/10 blur-3xl" />
      </div>
      <div className="relative mx-auto flex max-w-6xl flex-col gap-16 px-6 py-24 lg:flex-row lg:items-center">
        <div className="max-w-2xl space-y-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            Guided Onboarding
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-navy/70 px-2 py-0.5 text-[10px] font-medium text-slate-200">
              Nova-ready
            </span>
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Make sharper DeFi moves with live market, protocol, and risk analytics in one place.
          </h1>
          <p className="text-lg text-slate-300 lg:text-xl">
            DeFiCalc distills on-chain noise into friendly dashboards so newcomers learn with confidence and experts stay ahead of the next opportunity.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#markets"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary via-brand-teal to-brand-aqua px-6 py-3 text-sm font-semibold text-brand-midnight shadow-glow transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-teal/40"
            >
              Explore Dashboard
            </a>
            <a
              href="#protocols"
              className="inline-flex items-center justify-center rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-primary hover:text-white"
            >
              View Market Data
            </a>
          </div>
          <ul className="grid gap-4 pt-6 text-sm text-slate-300 sm:grid-cols-2">
            <HeroHighlight icon="pulse" title="Live risk scores" description="Gauge strategy health with transparent scoring." />
            <HeroHighlight icon="compass" title="Guided walkthroughs" description="Tooltips and explainers keep DeFi approachable." />
            <HeroHighlight icon="chart" title="Familiar layout" description="CMC-style tables with deeper analytics layers." />
            <HeroHighlight icon="spark" title="Nova assistant" description="Chat your way through calculations when you need help." />
          </ul>
        </div>
        <StrategyMonitor />
      </div>
    </section>
  );
}

interface HeroHighlightProps {
  icon: "pulse" | "compass" | "chart" | "spark";
  title: string;
  description: string;
}

function HeroHighlight({ icon, title, description }: HeroHighlightProps) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-slate-800/80 bg-brand-navy/30 p-4 backdrop-blur">
      <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy/70 text-brand-aqua">
        {getIcon(icon)}
      </span>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
    </li>
  );
}

function getIcon(icon: HeroHighlightProps["icon"]) {
  switch (icon) {
    case "pulse":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h3l2-6 4 12 2-6h3" />
        </svg>
      );
    case "compass":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 15.5 12 12l3.5-3.5-1.5 5.5z" />
        </svg>
      );
    case "chart":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" d="M4 20h16" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16V8m4 8v-4m4 4V6" />
        </svg>
      );
    case "spark":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m12 3 1.88 5.79L19.5 9l-4.56 3.32L16.76 18 12 14.88 7.24 18l1.82-5.68L4.5 9l5.62-.21z" />
        </svg>
      );
    default:
      return null;
  }
}

function StrategyMonitor() {
  return (
    <div className="relative w-full max-w-md rounded-3xl border border-slate-900/70 bg-brand-navy/70 p-6 text-slate-200 shadow-card backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Strategy Monitor</p>
          <p className="text-sm text-slate-400">Auto-refreshing as on-chain data streams in.</p>
        </div>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Live soon
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {strategyMonitorEntries.map((strategy) => (
          <article
            key={strategy.name}
            className="rounded-2xl border border-slate-800/70 bg-brand-midnight/80 p-4 shadow-inner"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">{strategy.name}</p>
                <p className="text-xs text-slate-400">{strategy.chain}</p>
              </div>
              <span
                className={clsx(
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                  strategy.risk === "Safe" && "bg-brand-teal/10 text-brand-teal",
                  strategy.risk === "Balanced" && "bg-primary/10 text-primary",
                  strategy.risk === "Growth" && "bg-accent/10 text-accent"
                )}
              >
                {strategy.risk}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-xs text-slate-400">
              <div>
                <dt className="font-semibold text-slate-300">Net APR</dt>
                <dd className="text-base font-semibold text-brand-aqua">{strategy.netApr}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-300">Rewards</dt>
                <dd className="text-sm text-white">{strategy.rewards}</dd>
              </div>
              <div className="col-span-2">
                <dt className="font-semibold text-slate-300">Health</dt>
                <div className="mt-1 flex items-center gap-3">
                  <div className="relative h-2 w-full rounded-full bg-slate-800">
                    <span
                      className="absolute left-0 top-0 h-2 rounded-full bg-gradient-to-r from-brand-teal via-primary to-accent"
                      style={{ width: `${strategy.health}%` }}
                    />
                  </div>
                  <dd className="text-sm font-semibold text-white">{strategy.health}/100</dd>
                </div>
              </div>
              <div className="col-span-2 text-xs text-slate-400">{strategy.description}</div>
            </dl>
          </article>
        ))}
      </div>
      <p className="mt-6 text-xs text-slate-500">
        Hook up your wallet or connect Nova to personalize risk alerts when the full app launches.
      </p>
    </div>
  );
}
