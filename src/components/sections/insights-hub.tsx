import { insightPrompts } from "@/lib/site-content";

export function InsightsHubSection() {
  return (
    <section id="insights" className="border-b border-slate-900 bg-brand-deep py-20">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="space-y-6">
          <span className="rounded-full border border-brand-teal/30 bg-brand-teal/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-teal">
            Insights & onboarding
          </span>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">Nova keeps guidance one click away.</h2>
          <p className="text-base text-slate-300">
            The Nova assistant sits beside your analytics, ready to explain concepts, generate calculator templates and translate governance updates into plain language. Integrate the chat panel when engineering enables Nova’s API, without changing the page structure.
          </p>
          <div className="rounded-3xl border border-slate-900/70 bg-brand-midnight/70 p-6 text-sm text-slate-300">
            <h3 className="text-base font-semibold text-white">Suggested prompts</h3>
            <ul className="mt-4 space-y-3">
              {insightPrompts.map((prompt) => (
                <li key={prompt} className="flex items-start gap-3 rounded-2xl border border-transparent bg-brand-navy/50 p-4 transition hover:border-primary/40 hover:text-white">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-navy/80 text-brand-teal">?
                  </span>
                  {prompt}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-slate-500">
              Nova can plug into protocol cards, risk widgets or calculator blocks — call the chat programmatically with relevant context to streamline user conversations.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <article className="rounded-3xl border border-slate-900/70 bg-brand-midnight/80 p-6 shadow-card">
            <h3 className="text-lg font-semibold text-white">Getting started lane</h3>
            <p className="mt-2 text-sm text-slate-400">
              Introduce new users to DeFi vocabulary with bite-sized lessons and glossary tooltips. Pair each lesson with a Nova question so onboarding flows like a tutorial, not a trading terminal.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-navy/80 text-brand-aqua">1</span>
                Welcome tour featuring core KPIs
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-navy/80 text-brand-aqua">2</span>
                Glossary overlays explain TVL, APY, collateral ratios
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-navy/80 text-brand-aqua">3</span>
                Nova orbits the UI to answer follow-up questions instantly
              </li>
            </ul>
          </article>
          <article className="rounded-3xl border border-slate-900/70 bg-brand-midnight/80 p-6 shadow-card">
            <h3 className="text-lg font-semibold text-white">Sponsored spotlight</h3>
            <p className="mt-2 text-sm text-slate-400">
              Reserve card slots to showcase partner strategies or advertisers. Content inherits site styling and stays clearly labeled, keeping the experience trustworthy while unlocking revenue opportunities.
            </p>
            <div className="mt-4 grid gap-3 text-xs text-slate-300">
              <div className="flex items-center justify-between rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-accent">
                <span>Featured vault • 14% blended APY</span>
                <span className="text-[10px] font-semibold uppercase tracking-widest">Sponsored</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-brand-navy/60 px-4 py-3">
                <span>Nova quick brief</span>
                <button className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-slate-300 transition hover:border-primary hover:text-white">
                  Generate
                </button>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-brand-navy/50 p-4">
                <p className="text-[11px] uppercase tracking-widest text-slate-500">Sandbox teaser</p>
                <p className="mt-2 text-sm text-slate-300">
                  Drag components like <span className="text-primary">Token price</span> or <span className="text-brand-teal">Borrow rate</span> into formulas to model scenarios. Nova can walk through the math step-by-step.
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
