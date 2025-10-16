import { featureHighlights } from "@/lib/site-content";

export function FeaturesSection() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {featureHighlights.map((feature) => (
        <article
          key={feature.title}
          className="flex flex-col justify-between rounded-3xl border border-slate-800/60 bg-abyss/80 p-6 shadow-panel transition hover:-translate-y-1"
        >
          <div className="flex items-start gap-4">
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.accent} text-lg font-semibold text-white`}>
              <FeatureIcon name={feature.icon} />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
            </div>
          </div>
          <ul className="mt-6 space-y-2 text-xs text-slate-400">
            {feature.details.map((detail) => (
              <li key={detail} className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] text-white">•</span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function FeatureIcon({ name }: { name: string }) {
  switch (name) {
    case "network":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
          <path
            d="M12 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm5.5 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm-11 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM12 15a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm8-1.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm-12 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm1.2-4.2a5 5 0 0 0 5.6 0M7.6 13.6a5 5 0 0 0 3.4 1.4 5 5 0 0 0 3.4-1.4m3.7-3.7a5 5 0 0 1-3.4 1.4 5 5 0 0 1-3.4-1.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "gauge":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
          <path
            d="M12 5a9 9 0 0 0-9 9c0 2.4.94 4.62 2.65 6.32A1 1 0 0 0 6.36 19 7 7 0 1 1 12 19a1 1 0 0 0 .71 1.7h.01A9 9 0 0 0 21 14a9 9 0 0 0-9-9Zm0 6a3 3 0 0 0-2.24 5l-1.22 2.04a1 1 0 1 0 1.72 1l1.21-2.03A3 3 0 1 0 12 11Z"
            fill="currentColor"
          />
        </svg>
      );
    case "collaboration":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
          <path
            d="M9 7a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm8 2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm-10 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm10 2c-1.76 0-3.32.88-4.26 2.22a5.97 5.97 0 0 0-3.48 0A5.24 5.24 0 0 0 5 16.5c0 1.46.74 2.8 1.97 3.7A1 1 0 0 0 8.5 19.5a3.24 3.24 0 0 1-1.5-2.75c0-1.79 1.71-3.25 4-3.25s4 1.46 4 3.25c0 1.11-.6 2.11-1.5 2.75a1 1 0 0 0 1.53 1.3A4.74 4.74 0 0 0 19 16.5c0-2.48-2.24-4.5-5-4.5Z"
            fill="currentColor"
          />
        </svg>
      );
    case "sandbox":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
          <path
            d="M5 4a1 1 0 0 0-1 1v12.59A2.41 2.41 0 0 0 6.41 20H18a1 1 0 0 0 1-1V7.41A2.41 2.41 0 0 0 16.59 5H13l-2-2H5Zm9.5 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm-6 5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z"
            fill="currentColor"
          />
        </svg>
      );
    default:
      return null;
  }
}
