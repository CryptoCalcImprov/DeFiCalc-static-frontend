import { workflowSteps } from "@/lib/site-content";

export function WorkflowSection() {
  return (
    <ol className="space-y-6">
      {workflowSteps.map((step) => (
        <li key={step.title} className="rounded-xl border border-slate-900 bg-slate-950 p-6">
          <h3 className="text-lg font-semibold text-white">{step.title}</h3>
          <p className="mt-2 text-sm text-slate-300">{step.description}</p>
        </li>
      ))}
    </ol>
  );
}
