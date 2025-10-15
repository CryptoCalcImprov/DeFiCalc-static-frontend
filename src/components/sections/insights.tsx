import { insightHighlights } from "@/lib/site-content";

export function InsightsSection() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {insightHighlights.map((insight) => (
        <article
          key={insight.title}
          className="flex h-full flex-col justify-between rounded-3xl border border-slate-900/70 bg-slate-950/80 p-6 shadow-lg shadow-slate-950/40"
        >
          <div>
            <span className="inline-flex items-center rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              {insight.category}
            </span>
            <h3 className="mt-5 text-lg font-semibold text-white">{insight.title}</h3>
            <p className="mt-3 text-sm text-slate-400">{insight.excerpt}</p>
          </div>
          <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
            <span>{insight.time}</span>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Read more
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
