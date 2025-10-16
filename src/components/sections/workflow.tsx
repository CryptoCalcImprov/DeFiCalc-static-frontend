import { deliverableMilestones } from "@/lib/site-content";

export function WorkflowSection() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {deliverableMilestones.map((milestone) => (
        <article key={milestone.title} className="rounded-3xl border border-slate-800/60 bg-abyss/80 p-6 shadow-panel">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{milestone.status}</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{milestone.title}</h3>
            </div>
            <span className="rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-slate-300">
              Design
            </span>
          </div>
          <p className="mt-4 text-sm text-slate-300">{milestone.description}</p>
          <ul className="mt-6 space-y-2 text-xs text-slate-400">
            {milestone.tasks.map((task) => (
              <li key={task} className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] text-white">✔</span>
                <span>{task}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
