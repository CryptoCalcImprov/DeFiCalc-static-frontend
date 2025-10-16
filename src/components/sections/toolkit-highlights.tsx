import { toolkitHighlights } from "@/lib/site-content";

function renderIcon(type: (typeof toolkitHighlights)[number]["icon"]) {
  switch (type) {
    case "network":
      return (
        <svg className="h-8 w-8 text-mint" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="16" cy="16" r="6" />
          <path d="M16 2v6M16 24v6M2 16h6M24 16h6M7.5 7.5l4.2 4.2M20.3 20.3l4.2 4.2M24.5 7.5l-4.2 4.2M11.7 20.3l-4.2 4.2" />
        </svg>
      );
    case "gauge":
      return (
        <svg className="h-8 w-8 text-primary" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 22a12 12 0 1 1 24 0" />
          <path d="M16 16l6-6" strokeLinecap="round" />
          <circle cx="16" cy="22" r="2" fill="currentColor" />
        </svg>
      );
    case "team":
      return (
        <svg className="h-8 w-8 text-lavender" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="12" r="4" />
          <circle cx="21" cy="10" r="3" />
          <path d="M4 26c0-3.3 3-6 7-6s7 2.7 7 6" />
          <path d="M19 26c0-2.5 2.3-4.5 5-4.5 1 0 2 .2 2.8.6" />
        </svg>
      );
    case "sandbox":
      return (
        <svg className="h-8 w-8 text-mint" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="4" y="6" width="24" height="20" rx="3" />
          <path d="M11 12h10M11 18h6" />
          <circle cx="22" cy="18" r="1.5" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}

export function ToolkitHighlightsSection() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {toolkitHighlights.map((highlight) => (
        <article
          key={highlight.title}
          className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-lg shadow-black/10"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/70">
              {renderIcon(highlight.icon)}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">{highlight.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{highlight.description}</p>
              {'networks' in highlight && highlight.networks ? (
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                  {highlight.networks.map((network) => (
                    <span key={network} className="rounded-full border border-slate-800/70 bg-slate-900/60 px-3 py-1">
                      {network}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
