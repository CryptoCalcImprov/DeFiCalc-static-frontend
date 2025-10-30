import { HeroSection } from "@/components/sections/hero";
import { InsightsSection } from "@/components/sections/insights";
import { MarketPulseSection } from "@/components/sections/market-pulse";
import { ProtocolLeadersSection } from "@/components/sections/protocol-leaders";
import { Section } from "@/components/layout/section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Scene3D } from "@/components/ui/Scene3D";

export default function HomePage() {
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
            title="Market pulse that surfaces what matters"
            description="Monitor macro DeFi health, stablecoin flows, and the pairs gaining momentum across networks."
          >
            <MarketPulseSection />
          </Section>
          <Section
            id="protocols"
            title="Protocol leaders and governance radar"
            description="Rank strategies by TVL, growth, and on-chain governance signals so you never miss a pivotal update."
          >
            <ProtocolLeadersSection />
          </Section>
          <Section
            id="insights"
            title="Insights library that educates while you explore"
            description="Guided explainers and playbooks keep new users confident and give veterans deeper context for every move."
          >
            <InsightsSection />
          </Section>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
