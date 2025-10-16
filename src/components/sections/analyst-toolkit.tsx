import { featureHighlights } from "@/lib/site-content";

export function AnalystToolkitSection() {
  return (
    <section id="toolkit" className="border-b border-slate-900 bg-brand-midnight/70 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <header className="mb-10 max-w-3xl space-y-4">
          <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
            Analyst toolkit
          </span>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">Build once, scale across every workflow.</h2>
          <p className="text-base text-slate-300">
            Modular feature cards keep the platform flexible for upcoming modules like the Calculator Sandbox and Nova co-pilot. Integrate strategy components, cross-chain benchmarks and collaboration tools without redesigning the page.
          </p>
        </header>
        <div className="grid gap-6 lg:grid-cols-2">
          {featureHighlights.map((feature) => (
            <article
              key={feature.title}
              className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-slate-900/60 bg-brand-navy/50 p-6 shadow-card"
            >
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-brand-midnight/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-slate-300">
                  {feature.accent}
                </span>
                <div className="mt-4 flex items-start gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-midnight text-brand-aqua">
                    {renderIcon(feature.icon)}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm text-slate-400">{feature.description}</p>
                  </div>
                </div>
              </div>
              <ul className="grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
                {feature.detail.map((item) => (
                  <li
                    key={item}
                    className="inline-flex items-center gap-2 rounded-xl border border-transparent bg-brand-midnight/60 px-3 py-2 text-left transition hover:border-primary/40 hover:text-white"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-navy/80 text-brand-teal">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

type FeatureIcon = "network" | "gauge" | "workspace" | "sandbox";

function renderIcon(type: FeatureIcon) {
  switch (type) {
    case "network":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" />
        </svg>
      );
    case "gauge":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13a8 8 0 1 1-16 0" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m12 13 4-3" />
          <circle cx="12" cy="13" r="1" />
        </svg>
      );
    case "workspace":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path strokeLinecap="round" d="M3 10h18" />
          <path strokeLinecap="round" d="M9 3v4M15 3v4" />
        </svg>
      );
    case "sandbox":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 8h8v8H8z" />
          <path strokeLinecap="round" d="M12 8v8M8 12h8" />
        </svg>
      );
    default:
      return null;
  }
}
