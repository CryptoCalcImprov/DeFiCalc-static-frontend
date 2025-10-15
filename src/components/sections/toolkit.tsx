import { Button } from "@/components/ui/button";
import { toolkitFeatures } from "@/lib/site-content";

export function ToolkitSection() {
  return (
    <div className="rounded-3xl border border-slate-900/70 bg-slate-950/80 p-8 shadow-lg shadow-slate-950/50">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">Operator Toolkit</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">Model, monitor, and automate in one workspace.</h3>
          <p className="mt-4 text-sm text-slate-400">
            Pair real-time market feeds with powerful calculators to run scenarios, automate alerts, and collaborate on strategies before capital hits the chain.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button className="bg-gradient-to-r from-primary to-emerald-400 text-slate-950 shadow-glow hover:from-primary/90 hover:to-emerald-400/90">
              Start planning
            </Button>
            <Button href="#insights" variant="ghost" className="border border-slate-900 bg-slate-950/60 px-4 py-2 text-slate-200 hover:bg-slate-900">
              Browse insights
            </Button>
          </div>
        </div>
        <div className="grid flex-1 gap-4 md:grid-cols-3">
          {toolkitFeatures.map((feature) => (
            <article key={feature.title} className="flex h-full flex-col justify-between rounded-3xl border border-slate-900 bg-slate-950/70 p-5">
              <div>
                <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                  {feature.tag}
                </span>
                <h4 className="mt-4 text-lg font-semibold text-white">{feature.title}</h4>
                <p className="mt-3 text-sm text-slate-400">{feature.description}</p>
              </div>
              <div className="mt-4 text-xs text-slate-500">Advanced settings · Custom alerts</div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
