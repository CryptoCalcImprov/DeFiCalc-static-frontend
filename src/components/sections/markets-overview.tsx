import { marketSnapshot, narrativeHighlights } from "@/lib/site-content";

function getDeltaTone(value: number) {
  if (value > 0) return "text-success";
  if (value < 0) return "text-danger";
  return "text-slate-300";
}

export function MarketsOverview() {
  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <div className="grid gap-6 sm:grid-cols-3">
        {marketSnapshot.map((metric) => (
          <article key={metric.label} className="rounded-3xl border border-slate-800/60 bg-abyss/80 p-6 shadow-panel">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
            <p className="mt-3 text-2xl font-semibold text-white">{metric.value}</p>
            <p className={`mt-2 text-sm font-medium ${getDeltaTone(metric.change)}`}>
              {metric.change > 0 ? "+" : ""}
              {metric.change}%
            </p>
            <p className="mt-2 text-xs text-slate-400">{metric.description}</p>
          </article>
        ))}
      </div>
      <div className="space-y-4 rounded-3xl border border-slate-800/60 bg-abyss/80 p-6 shadow-panel">
        <h3 className="text-base font-semibold text-white">Narratives to watch</h3>
        <ul className="space-y-4 text-sm text-slate-300">
          {narrativeHighlights.map((item) => (
            <li key={item.title} className="rounded-2xl border border-slate-800/60 bg-deep/80 p-4">
              <span className="inline-flex items-center rounded-full border border-highlight/60 bg-highlight/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-highlight">
                {item.tag}
              </span>
              <p className="mt-2 text-base font-semibold text-white">{item.title}</p>
              <p className="mt-2 text-xs text-slate-400">{item.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
