import { novaSuggestions } from "@/lib/site-content";

export function NovaPreviewSection() {
  return (
    <section id="nova" className="border-b border-slate-900/70 bg-midnight/70 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Nova AI assistant</p>
            <h2 className="text-3xl font-semibold text-white">Ask Nova anything, from TVL basics to complex strategy breakdowns.</h2>
            <p className="text-sm text-slate-400">
              Nova pairs conversational onboarding with data-rich answers pulled from the dashboard. New users get friendly
              explanations, while pros can request collateralization stress tests or governance summaries.
            </p>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-secondary" aria-hidden="true" />
                Context-aware follow-ups keep the flow educational.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                Shares links to calculators, dashboards, or governance proposals.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                Can be toggled off for teams that prefer manual analysis.
              </li>
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-800/70 bg-midnight-200/40 p-6 shadow-card">
            <header className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-secondary/60 to-primary/60 text-sm font-semibold text-white">
                N
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Nova</p>
                <p className="text-xs text-slate-400">Your DeFi guide</p>
              </div>
            </header>
            <div className="mt-6 space-y-4 text-sm">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/80 text-xs text-slate-300">You</div>
                <div className="flex-1 rounded-2xl rounded-tl-none border border-slate-800/70 bg-midnight/70 p-4 text-slate-200">
                  How risky is the ETH liquid staking strategy this week?
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-secondary/60 to-primary/60 text-xs font-semibold text-white">
                  N
                </div>
                <div className="flex-1 rounded-2xl rounded-tr-none border border-secondary/40 bg-secondary/10 p-4 text-slate-100">
                  Health is stable at 86/100 with EigenLayer restake points accruing. Watch for the LST oracle update vote closing in
                  48h.
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {novaSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="rounded-full border border-slate-700/60 bg-midnight/60 px-4 py-2 text-xs text-slate-300 transition hover:border-secondary hover:text-white"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
