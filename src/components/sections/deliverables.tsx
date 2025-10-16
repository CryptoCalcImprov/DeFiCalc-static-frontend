import { Button } from "@/components/ui/button";
import { deliverables } from "@/lib/site-content";

export function DeliverablesSection() {
  return (
    <section id="insights" className="border-b border-slate-900/70 bg-midnight/60 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Design deliverables</p>
            <h2 className="text-3xl font-semibold text-white">Next steps to bring the DeFiCalc concept to life.</h2>
            <p className="text-sm text-slate-400">
              Structured handoff keeps designers, analysts, and engineers aligned. Each phase ensures accessible, flexible UI that
              evolves with new data integrations.
            </p>
          </div>
          <Button href="#launch" variant="outline" className="rounded-full px-6 py-3">
            Review project plan
          </Button>
        </header>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {deliverables.map((item) => (
            <article key={item.title} className="rounded-3xl border border-slate-800/70 bg-midnight-200/40 p-6 shadow-card">
              <h3 className="text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm text-slate-400">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
