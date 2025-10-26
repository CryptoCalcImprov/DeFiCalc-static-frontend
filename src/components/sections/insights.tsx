import { insightsLibrary } from "@/lib/site-content";

export function InsightsSection() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {insightsLibrary.map((insight) => (
        <article key={insight.title} className="rounded-3xl border border-slate-800/70 bg-slate-950 p-6">
          <h3 className="text-lg font-semibold text-white">{insight.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{insight.description}</p>
          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-mint transition hover:text-white"
          >
            {insight.action}
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 3l6 5-6 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </article>
      ))}
    </div>
  );
}
