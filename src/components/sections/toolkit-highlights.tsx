import { toolkitHighlights } from "@/lib/site-content";

function ToolkitIcon({ type }: { type: (typeof toolkitHighlights)[number]["icon"] }) {
  switch (type) {
    case "networks":
      return (
        <svg viewBox="0 0 32 32" className="h-10 w-10 text-secondary">
          <path
            d="M4 16h24M16 4v24M9 9l14 14M23 9 9 23"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "risk":
      return (
        <svg viewBox="0 0 32 32" className="h-10 w-10 text-primary">
          <path
            d="M8 24h16l3-10-11-6-11 6 3 10Zm8-4v-4m0 8h.01"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      );
    case "collaboration":
      return (
        <svg viewBox="0 0 32 32" className="h-10 w-10 text-accent">
          <path
            d="M11 14a5 5 0 1 1 10 0M6 26a6 6 0 0 1 12 0M14 26a6 6 0 0 1 12 0"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      );
    case "sandbox":
      return (
        <svg viewBox="0 0 32 32" className="h-10 w-10 text-emerald-300">
          <path
            d="M6 10h20v12H6V10Zm4 0v12m12-12v12M6 16h20"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      );
    default:
      return null;
  }
}

export function ToolkitHighlightsSection() {
  return (
    <section id="toolkit" className="border-b border-slate-900/70 bg-midnight/60 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <header className="max-w-2xl space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Analyst toolkit</p>
          <h2 className="text-3xl font-semibold text-white">Everything teams need to evaluate DeFi opportunities faster.</h2>
          <p className="text-sm text-slate-400">
            Modular cards, charts, and calculators form a workspace that flexes from solo exploration to team dashboards. Nova helps
            translate jargon while you collaborate in real time.
          </p>
        </header>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {toolkitHighlights.map((highlight) => (
            <article
              key={highlight.title}
              className="group relative overflow-hidden rounded-3xl border border-slate-800/70 bg-midnight-200/40 p-6 shadow-card"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 blur-3xl transition group-hover:opacity-80" aria-hidden="true" />
              <div className="relative flex items-start gap-4">
                <span className="inline-flex rounded-2xl bg-midnight/80 p-3">
                  <ToolkitIcon type={highlight.icon} />
                </span>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">{highlight.title}</h3>
                  <p className="text-sm text-slate-400">{highlight.description}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{highlight.meta}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
