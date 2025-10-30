import { HeroSection } from "@/components/sections/hero";
import { InsightsSection } from "@/components/sections/insights";
import { Section } from "@/components/layout/section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Scene3D } from "@/components/ui/Scene3D";
import { marketPulse, protocolLeaders } from "@/lib/site-content";

export default function HomePage() {
  const totals = marketPulse.totals;
  const trendingPairs = marketPulse.trending;
  const alerts = marketPulse.alerts.concat({ title: "Perps funding flips", detail: "ETH perpetuals turn positive on major venues" });
  const featuredProtocols = protocolLeaders.slice(0, 4);
  const governanceSignals = protocolLeaders.slice(0, 3);
  const yieldHighlights = [
    { name: "ETH LSD ladder", apr: "7.4%", chain: "Ethereum", platform: "Lido → Pendle", risk: "Balanced" },
    { name: "Stablecoin trident", apr: "12.1%", chain: "Arbitrum", platform: "Aave + GMX", risk: "Active" },
    { name: "Liquid staking delta", apr: "5.9%", chain: "Solana", platform: "Marinade", risk: "Conservative" },
    { name: "Real-yield vault", apr: "9.6%", chain: "Base", platform: "Aerodrome", risk: "Moderate" }
  ] as const;
  const executionQueue = [
    {
      title: "Trim ETH perp hedge",
      desk: "Derivatives",
      eta: "00:22",
      window: "Execute before next funding reset",
      priority: "High"
    },
    {
      title: "Rotate LSD sleeve",
      desk: "Yield Ops",
      eta: "01:10",
      window: "Shift 15% into sfrxETH vault",
      priority: "Medium"
    },
    {
      title: "Top up stable buffer",
      desk: "Treasury",
      eta: "02:45",
      window: "Rebalance Base USDC reserves",
      priority: "Low"
    }
  ] as const;
  const flowSnapshots = [
    {
      venue: "Curve stETH/ETH",
      flow: "+$6.2M",
      note: "LST arb desks adding leverage",
      pressure: "72%",
      bias: "Inflow"
    },
    {
      venue: "GMX perp vault",
      flow: "-$2.8M",
      note: "GLP redemptions after funding spike",
      pressure: "48%",
      bias: "Outflow"
    }
  ] as const;

  return (
    <div className="flex min-h-screen flex-col relative">
      <Scene3D />
      <div className="relative z-10">
        <SiteHeader />
        <main className="flex-1">
          <HeroSection />
          <Section
            id="workspace"
            title="Prototype scenarios inside Nova’s calculator lab"
            description="Sketch how the input panel will feel and imagine a build-your-own sandbox that lets analysts mix modules, run simulations, and share repeatable playbooks."
          >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-8">
              <div className="card-surface flex flex-col gap-5 rounded-2xl bg-gradient-to-br from-slate-950/75 via-slate-950/55 to-slate-900/30 p-4 shadow-[0_18px_48px_rgba(5,17,28,0.36)] sm:gap-6 sm:rounded-3xl sm:p-6">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-ocean/55 bg-surface/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-mint/90 sm:text-xs">
                    Nova workspace
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-slate-50 sm:text-xl">Mock calculator input panel</h3>
                  <p className="mt-2 text-xs text-muted sm:text-sm">
                    Tune tokens, cadence, and sizing before asking Nova to generate projections. Everything below is a
                    static mock to illustrate the interaction model.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-200 sm:gap-2 sm:text-sm">
                    Token
                    <div className="inline-flex items-center gap-2 rounded-xl border border-ocean/60 bg-surface/90 px-3 py-2 text-sm text-slate-50 shadow-inner sm:rounded-2xl sm:px-4 sm:text-base">
                      <span>ETH</span>
                      <span className="ml-auto rounded-full bg-mint/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-mint">
                        Favorite
                      </span>
                    </div>
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-200 sm:gap-2 sm:text-sm">
                    Contribution amount (USD)
                    <div className="rounded-xl border border-ocean/60 bg-surface/90 px-3 py-2 text-sm text-slate-50 shadow-inner sm:rounded-2xl sm:px-4 sm:text-base">
                      500
                    </div>
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-200 sm:gap-2 sm:text-sm">
                    Purchase cadence
                    <div className="flex items-center justify-between rounded-xl border border-ocean/60 bg-surface/90 px-3 py-2 text-sm text-slate-50 shadow-inner sm:rounded-2xl sm:px-4 sm:text-base">
                      Bi-weekly
                      <svg className="h-4 w-4 text-slate-400" viewBox="0 0 16 16" fill="none" aria-hidden>
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                      </svg>
                    </div>
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-200 sm:gap-2 sm:text-sm">
                    Duration
                    <div className="flex items-center justify-between rounded-xl border border-ocean/60 bg-surface/90 px-3 py-2 text-sm text-slate-50 shadow-inner sm:rounded-2xl sm:px-4 sm:text-base">
                      6 months
                      <svg className="h-4 w-4 text-slate-400" viewBox="0 0 16 16" fill="none" aria-hidden>
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                      </svg>
                    </div>
                  </label>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-cta-gradient px-4 py-2.5 text-xs font-semibold text-slate-50 shadow-lg shadow-[rgba(58,198,255,0.24)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint sm:w-auto sm:px-5 sm:py-3 sm:text-sm"
                  >
                    Run DCA projection
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                      <path d="M5 3l6 5-6 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <p className="text-[11px] text-muted sm:text-xs">
                    Nova will generate a narrative, cost basis forecast, and chart once the prototype goes live.
                  </p>
                </div>
                <div className="rounded-2xl border border-ocean/60 bg-surface/75 p-4 shadow-inner shadow-[0_0_24px_rgba(7,24,36,0.18)] sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-slate-100 sm:text-base">Projected price path preview</h4>
                    <span className="inline-flex items-center rounded-full border border-mint/45 bg-mint/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-mint/85 sm:text-[11px]">
                      Mock
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-muted sm:text-xs">
                    Placeholder visualization showing where Nova&rsquo;s chart will render once connected.
                  </p>
                  <div className="mt-9 h-48 rounded-xl border border-ocean/50 bg-gradient-to-tr from-slate-950/85 via-slate-900/55 to-ocean/55 p-3 sm:mt-10 sm:h-56 lg:h-64">
                    <div className="relative h-full w-full overflow-hidden rounded-lg border border-ocean/45 bg-surface/60">
                      <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                        <defs>
                          <linearGradient id="previewFill" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(58,198,255,0.32)" />
                            <stop offset="75%" stopColor="rgba(54,214,195,0.08)" />
                            <stop offset="100%" stopColor="rgba(4,26,42,0.05)" />
                          </linearGradient>
                          <linearGradient id="previewLine" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3AC6FF" />
                            <stop offset="60%" stopColor="#36D6C3" />
                            <stop offset="100%" stopColor="#7A40FF" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0 50 L8 48 L16 44 L24 40 L32 36 L40 33 L48 29 L56 23 L64 18 L72 22 L80 18 L88 14 L96 10 L100 12 L100 60 L0 60 Z"
                          fill="url(#previewFill)"
                          opacity="0.8"
                        />
                        <path
                          d="M0 50 L8 48 L16 44 L24 40 L32 36 L40 33 L48 29 L56 23 L64 18 L72 22 L80 18 L88 14 L96 10 L100 12"
                          stroke="url(#previewLine)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          fill="none"
                        />
                        {[{ x: 24, y: 40 }, { x: 48, y: 29 }, { x: 72, y: 22 }, { x: 96, y: 10 }].map((point, index) => (
                          <circle
                            key={index}
                            cx={point.x}
                            cy={point.y}
                            r="2.8"
                            fill="#36D6C3"
                            stroke="#041A2A"
                            strokeWidth="1.2"
                          />
                        ))}
                      </svg>
                      <div className="absolute inset-x-6 bottom-6 grid gap-3 text-[10px] text-slate-300/90 sm:text-xs sm:grid-cols-3">
                        <div className="flex flex-col rounded-lg bg-surface/70 px-3 py-2 shadow-[0_0_16px_rgba(6,21,34,0.25)]">
                          <span className="text-[11px] font-medium text-slate-200 sm:text-xs">Next buy</span>
                          <span className="text-sm font-semibold text-slate-50 sm:text-base">$540</span>
                          <span className="text-[10px] text-slate-300/80">+3.2% vs plan</span>
                        </div>
                        <div className="flex flex-col rounded-lg bg-surface/70 px-3 py-2 shadow-[0_0_16px_rgba(6,21,34,0.25)]">
                          <span className="text-[11px] font-medium text-slate-200 sm:text-xs">Cost basis</span>
                          <span className="text-sm font-semibold text-slate-50 sm:text-base">$1,920</span>
                          <span className="text-[10px] text-slate-300/80">Accumulated to date</span>
                        </div>
                        <div className="flex flex-col rounded-lg bg-surface/70 px-3 py-2 shadow-[0_0_16px_rgba(6,21,34,0.25)]">
                          <span className="text-[11px] font-medium text-slate-200 sm:text-xs">Run status</span>
                          <span className="text-sm font-semibold text-slate-50 sm:text-base">Pending</span>
                          <span className="text-[10px] text-slate-300/80">Awaiting Nova&rsquo;s run</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-6">
                <div className="card-surface-muted flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-slate-950/65 via-slate-950/45 to-slate-900/24 p-4 shadow-[0_16px_40px_rgba(6,21,34,0.32)] sm:gap-5 sm:rounded-3xl sm:p-6">
                  <h3 className="text-lg font-semibold text-slate-50 sm:text-xl">Nova&rsquo;s quick take</h3>
                  <div className="rounded-2xl border border-ocean/65 bg-surface/80 p-4 shadow-inner shadow-[0_0_28px_rgba(7,24,36,0.22)] sm:p-5">
                    <ul className="space-y-2 text-xs leading-relaxed text-muted sm:space-y-3 sm:text-sm">
                      <li className="flex items-start gap-2">
                        <span className="mt-1 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-mint shadow-[0_0_8px_rgba(58,198,255,0.65)]" aria-hidden />
                        <span className="flex-1">
                          Projection commentary renders as succinct bullets so analysts can share takeaways in team
                          spaces without rewriting.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-mint shadow-[0_0_8px_rgba(58,198,255,0.65)]" aria-hidden />
                        <span className="flex-1">
                          Responses blend Nova&rsquo;s reasoning with structured datasets for price history or balance
                          projections.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-mint shadow-[0_0_8px_rgba(58,198,255,0.65)]" aria-hidden />
                        <span className="flex-1">
                          Analysts can pin any scenario to briefs so cross-functional teams can iterate on the same
                          baseline assumptions.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-surface flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-slate-950/70 via-slate-950/50 to-slate-900/28 p-4 shadow-[0_18px_48px_rgba(5,17,28,0.36)] sm:gap-5 sm:rounded-3xl sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-50 sm:text-xl">Sandbox your own calculator</h3>
                    <span className="inline-flex items-center rounded-full border border-mint/45 bg-mint/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-mint/85 sm:text-xs">
                      Prototype
                    </span>
                  </div>
                  <p className="text-xs text-muted sm:text-sm">
                    Compose reusable modules, apply guardrails, and hand the flow to Nova for narration. Imagine dragging
                    data feeds, alerts, and AI helpers into a shared workspace.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                    <div className="rounded-2xl border border-ocean/60 bg-surface/80 p-4 shadow-inner shadow-[0_0_24px_rgba(7,24,36,0.18)] sm:p-5">
                      <h4 className="text-sm font-semibold text-slate-100 sm:text-base">Active stack</h4>
                      <div className="mt-3 space-y-2 text-xs text-muted sm:space-y-3 sm:text-sm">
                        <div className="flex items-center justify-between rounded-xl bg-surface/65 px-3 py-2">
                          <span>On-chain price feed</span>
                          <span className="rounded-full bg-mint/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-mint">
                            Live
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-surface/65 px-3 py-2">
                          <span>Volatility band guard</span>
                          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                            Watch
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-surface/65 px-3 py-2">
                          <span>Stablecoin ladder</span>
                          <span className="rounded-full bg-slate-500/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-200">
                            Draft
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-ocean/55 bg-surface/60 p-4 sm:p-5">
                      <h4 className="text-sm font-semibold text-slate-100 sm:text-base">Module library</h4>
                      <div className="flex flex-wrap gap-2 text-[11px] text-slate-200 sm:text-xs">
                        <span className="rounded-full border border-ocean/55 bg-surface/70 px-3 py-1">Yield curve blend</span>
                        <span className="rounded-full border border-ocean/55 bg-surface/70 px-3 py-1">DEX depth probe</span>
                        <span className="rounded-full border border-ocean/55 bg-surface/70 px-3 py-1">Treasury policy</span>
                        <span className="rounded-full border border-ocean/55 bg-surface/70 px-3 py-1">AI summary</span>
                        <span className="rounded-full border border-ocean/55 bg-surface/70 px-3 py-1">Stress tests</span>
                      </div>
                      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ocean/45 bg-surface/55 px-4 py-6 text-center text-[11px] text-muted sm:text-xs">
                        Drop a module to extend the calculator flow.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Section>
          <Section
            id="markets"
            title="DeFi markets at analyst speed"
            description="Surface liquidity moves, price momentum, and protocol yields without toggling across dashboards. Built for desks that live on-chain."
          >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8">
              <div className="flex flex-col gap-6">
                <div className="card-surface flex flex-col gap-5 rounded-2xl bg-gradient-to-br from-slate-950/80 via-slate-950/55 to-slate-900/24 p-4 shadow-[0_18px_48px_rgba(5,17,28,0.36)] sm:gap-6 sm:rounded-3xl sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-50 sm:text-xl">Global market pulse</h3>
                      <p className="text-[11px] text-muted sm:text-xs">Aggregated across the top 12 DeFi networks.</p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-mint/35 bg-mint/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-mint/85 sm:text-xs">
                      Live feed
                    </span>
                  </div>
                  <dl className="grid gap-4 sm:grid-cols-3">
                    {totals.map((item) => {
                      const isPositive = item.change.trim().startsWith("+");
                      return (
                        <div
                          key={item.label}
                          className="rounded-2xl border border-ocean/55 bg-surface/75 px-4 py-3 shadow-inner shadow-[0_0_24px_rgba(7,24,36,0.18)]"
                        >
                          <dt className="text-[11px] font-medium uppercase tracking-widest text-slate-300 sm:text-xs">
                            {item.label}
                          </dt>
                          <dd className="mt-2 text-lg font-semibold text-slate-50 sm:text-xl">{item.value}</dd>
                          <span className={`text-[11px] font-medium ${isPositive ? "text-mint" : "text-critical"}`}>
                            {item.change}
                          </span>
                        </div>
                      );
                    })}
                  </dl>
                  <div className="rounded-2xl border border-ocean/60 bg-surface/70 p-4 shadow-inner shadow-[0_0_24px_rgba(7,24,36,0.18)] sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h4 className="text-sm font-semibold text-slate-100 sm:text-base">Price momentum</h4>
                      <span className="text-[11px] text-muted sm:text-xs">Nova highlights projected trendlines.</span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {trendingPairs.map((pair) => {
                        const positive = pair.change.trim().startsWith("+");
                        return (
                          <div
                            key={pair.name}
                            className="rounded-xl border border-ocean/60 bg-gradient-to-br from-slate-950/85 via-slate-900/60 to-slate-900/30 px-4 py-3 shadow-[0_12px_32px_rgba(6,21,34,0.28)]"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-50">{pair.name}</p>
                              <span
                                className={`text-[11px] font-semibold ${positive ? "text-mint" : "text-critical"}`}
                              >
                                {pair.change}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted">{pair.metric}</p>
                            <div className="mt-3 h-14 overflow-hidden rounded-lg border border-ocean/55 bg-[radial-gradient(circle_at_top,_rgba(58,198,255,0.25),transparent_70%)]">
                              <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full w-full">
                                <defs>
                                  <linearGradient id={`trend-${pair.name}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#3AC6FF" />
                                    <stop offset="60%" stopColor="#36D6C3" />
                                    <stop offset="100%" stopColor="#7A40FF" />
                                  </linearGradient>
                                </defs>
                                <path
                                  d="M0 30 L10 26 L20 28 L30 22 L40 18 L50 20 L60 14 L70 16 L80 10 L90 14 L100 8"
                                  stroke={`url(#trend-${pair.name})`}
                                  strokeWidth="2.2"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M0 30 L10 26 L20 28 L30 22 L40 18 L50 20 L60 14 L70 16 L80 10 L90 14 L100 8 L100 40 L0 40 Z"
                                  fill="rgba(58,198,255,0.12)"
                                  opacity="0.85"
                                />
                              </svg>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="card-surface-muted flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-slate-950/70 via-slate-950/45 to-slate-900/24 p-4 shadow-[0_16px_40px_rgba(6,21,34,0.32)] sm:gap-5 sm:rounded-3xl sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-50 sm:text-xl">Risk &amp; alert monitor</h3>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/45 bg-amber-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100 sm:text-xs">
                      Watchlist
                    </span>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <ul className="space-y-3 text-sm text-slate-200">
                      {alerts.map((alert) => (
                        <li
                          key={alert.title}
                          className="flex items-start gap-3 rounded-2xl border border-ocean/60 bg-surface/80 p-4 shadow-inner shadow-[0_0_24px_rgba(7,24,36,0.18)]"
                        >
                          <span className="mt-1 inline-flex h-2.5 w-2.5 flex-shrink-0 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(255,193,7,0.55)]" aria-hidden />
                          <div className="flex-1">
                            <p className="font-semibold text-slate-50">{alert.title}</p>
                            <p className="mt-1 text-xs text-muted">{alert.detail}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="rounded-2xl border border-amber-400/45 bg-amber-500/10 p-4 shadow-inner shadow-[0_0_24px_rgba(255,193,7,0.18)]">
                      <h4 className="text-sm font-semibold text-amber-100 sm:text-base">Liquidations heatmap</h4>
                      <p className="mt-2 text-xs text-amber-50/80 sm:text-sm">
                        Nova flags at‑risk positions.
                      </p>
                      <div className="mt-4 grid gap-3 text-xs text-slate-900 sm:text-sm">
                        {[
                          { market: "Aave ETH", ratio: "162%", threshold: "150%", status: "Caution" },
                          { market: "Maker wBTC", ratio: "148%", threshold: "145%", status: "Critical" },
                          { market: "GMX GLP", ratio: "136%", threshold: "125%", status: "Watching" }
                        ].map((item) => (
                          <div
                            key={item.market}
                            className="rounded-xl bg-white/15 px-3 py-2 text-left backdrop-blur"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-white/95">{item.market}</span>
                              <span
                                className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
                                  item.status === "Critical"
                                    ? "text-critical"
                                    : item.status === "Caution"
                                    ? "text-amber-200"
                                    : "text-info"
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-[11px] text-white/80">
                              <span>Current: {item.ratio}</span>
                              <span>Trigger: {item.threshold}</span>
                            </div>
                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                              <div
                                className={`h-full ${
                                  item.status === "Critical"
                                    ? "bg-critical"
                                    : item.status === "Caution"
                                    ? "bg-amber-300"
                                    : "bg-info"
                                }`}
                                style={{ width: item.ratio.replace("%", "") }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-surface flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-indigo-950/75 via-slate-950/50 to-slate-900/28 p-4 shadow-[0_18px_48px_rgba(5,17,28,0.36)] sm:gap-5 sm:rounded-3xl sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-50 sm:text-xl">Execution queue</h3>
                    <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/45 bg-indigo-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-100 sm:text-xs">
                      Nova desk brief
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-2.5">
                      {executionQueue.map((ticket) => (
                        <div
                          key={ticket.title}
                          className="rounded-2xl border border-ocean/60 bg-surface/80 p-3.5 shadow-inner shadow-[0_0_20px_rgba(7,24,36,0.18)]"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-50">{ticket.title}</p>
                              <p className="text-[11px] text-muted sm:text-xs">{ticket.window}</p>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] ${
                                ticket.priority === "High"
                                  ? "border border-critical/50 bg-critical/15 text-critical"
                                  : ticket.priority === "Medium"
                                  ? "border border-amber-400/45 bg-amber-500/15 text-amber-200"
                                  : "border border-slate-500/35 bg-slate-500/15 text-slate-200"
                              }`}
                            >
                              {ticket.priority}
                            </span>
                          </div>
                          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-300 sm:text-xs">
                            <span className="font-medium text-slate-200">{ticket.desk}</span>
                            <span className="inline-flex items-center gap-1 text-slate-200">
                              <svg
                                className="h-3.5 w-3.5 text-slate-400"
                                viewBox="0 0 16 16"
                                fill="none"
                                aria-hidden
                              >
                                <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
                                <path d="M8 4.5V8l2.25 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                              {ticket.eta}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-ocean/60 bg-gradient-to-br from-slate-950/85 via-slate-900/65 to-slate-900/35 p-3.5 shadow-inner shadow-[0_0_20px_rgba(7,24,36,0.18)]">
                      <h4 className="text-sm font-semibold text-slate-100 sm:text-base">Flow monitor</h4>
                      <p className="mt-2 text-xs text-muted">Desk net flows across key venues.</p>
                      <div className="mt-3 space-y-2.5">
                        {flowSnapshots.map((flow) => (
                          <div key={flow.venue} className="rounded-xl bg-surface/70 px-3 py-2 shadow-[0_0_14px_rgba(6,21,34,0.22)]">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-50">{flow.venue}</p>
                              <span
                                className={`text-xs font-semibold ${
                                  flow.bias === "Inflow" ? "text-mint" : "text-critical"
                                }`}
                              >
                                {flow.flow}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-muted sm:text-xs">{flow.note}</p>
                            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                              <div
                                className={`h-full rounded-full ${
                                  flow.bias === "Inflow" ? "bg-mint" : "bg-critical"
                                }`}
                                style={{ width: flow.pressure }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div id="defi" className="flex scroll-mt-24 flex-col gap-6">
                <div className="card-surface flex flex-col gap-5 rounded-2xl bg-gradient-to-br from-slate-950/78 via-slate-950/50 to-slate-900/28 p-4 shadow-[0_18px_48px_rgba(5,17,28,0.36)] sm:gap-6 sm:rounded-3xl sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-50 sm:text-xl">Yield board</h3>
                    <span className="text-[11px] text-muted sm:text-xs">Updated 5 minutes ago</span>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-ocean/55 bg-surface/75 shadow-inner shadow-[0_0_24px_rgba(7,24,36,0.18)]">
                    <table className="w-full text-left text-xs text-slate-200 sm:text-sm">
                      <thead className="bg-surface/85 text-[11px] uppercase tracking-[0.22em] text-slate-300">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Strategy</th>
                          <th className="px-4 py-3 font-semibold">APR</th>
                          <th className="px-4 py-3 font-semibold">Chain</th>
                          <th className="px-4 py-3 font-semibold">Stack</th>
                          <th className="px-4 py-3 font-semibold text-right">Risk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {yieldHighlights.map((item) => (
                          <tr key={item.name} className="border-t border-slate-800/60">
                            <td className="px-4 py-3 font-semibold text-slate-100">{item.name}</td>
                            <td className="px-4 py-3 text-mint">{item.apr}</td>
                            <td className="px-4 py-3">{item.chain}</td>
                            <td className="px-4 py-3 text-slate-300/90">{item.platform}</td>
                            <td className="px-4 py-3 text-right text-[11px] uppercase tracking-wide text-slate-300">
                              {item.risk}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card-surface-muted flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-slate-950/65 via-slate-950/45 to-slate-900/24 p-4 shadow-[0_16px_40px_rgba(6,21,34,0.32)] sm:gap-5 sm:rounded-3xl sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-50 sm:text-xl">Protocol watchlist</h3>
                    <span className="inline-flex items-center gap-2 rounded-full border border-ocean/55 bg-surface/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200 sm:text-xs">
                      TVL + governance
                    </span>
                  </div>
                  <div className="space-y-3">
                    {featuredProtocols.map((protocol) => (
                      <div
                        key={protocol.name}
                        className="rounded-2xl border border-ocean/60 bg-surface/80 p-4 shadow-inner shadow-[0_0_24px_rgba(7,24,36,0.18)]"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-50">{protocol.name}</p>
                            <p className="text-[11px] text-muted sm:text-xs">
                              {protocol.chain} · {protocol.category}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-slate-50">{protocol.tvl}</span>
                            <span
                              className={`text-xs font-semibold ${
                                protocol.changeDirection === "up" ? "text-mint" : "text-critical"
                              }`}
                            >
                              {protocol.change24h}
                            </span>
                          </div>
                        </div>
                        <p className="mt-3 text-xs text-muted">{protocol.governanceNote}</p>
                        {"sponsored" in protocol && protocol.sponsored ? (
                          <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-lavender/45 bg-lavender/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-lavender">
                            Spotlight
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card-surface flex h-full flex-col gap-4 rounded-2xl bg-gradient-to-br from-slate-950/78 via-slate-950/48 to-slate-900/26 p-4 shadow-[0_18px_48px_rgba(5,17,28,0.36)] sm:h-full sm:gap-5 sm:rounded-3xl sm:p-6 lg:min-h-[300px]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-50 sm:text-xl">Governance radar</h3>
                    <span className="text-[11px] text-muted sm:text-xs">Auto-synced from Snapshot &amp; Tally.</span>
                  </div>
                  <ul className="flex-1 space-y-3 text-sm text-slate-200">
                    {governanceSignals.map((signal) => (
                      <li
                        key={signal.name}
                        className="rounded-2xl border border-ocean/60 bg-surface/80 p-4 shadow-inner shadow-[0_0_24px_rgba(7,24,36,0.18)]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-slate-50">
                            {signal.name} · <span className="text-slate-300">{signal.category}</span>
                          </p>
                          <span
                            className={`text-xs font-semibold ${
                              signal.changeDirection === "up" ? "text-mint" : "text-critical"
                            }`}
                          >
                            {signal.change24h}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-muted">{signal.governanceNote}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Section>
          <Section
            id="insights"
            title="AI insights by Nova"
            description="Education tracks stay in lockstep with Nova’s data pipelines—pairing explainers, calculators, and governance context in one flow."
          >
            <InsightsSection />
          </Section>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
