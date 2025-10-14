import { featureCards } from "@/lib/site-content";

export function FeaturesSection() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {featureCards.map((feature) => (
        <article key={feature.title} className="rounded-xl border border-slate-900 bg-slate-950 p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{feature.description}</p>
        </article>
      ))}
    </div>
  );
}
