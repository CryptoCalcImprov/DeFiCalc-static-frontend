import { Button } from "@/components/ui/button";

export function LaunchCTASection() {
  return (
    <section id="launch" className="bg-gradient-to-br from-[#08142B] via-midnight to-[#0A203A] py-20">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-800/70 bg-midnight/70 p-10 text-center shadow-card">
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          <h2 className="text-3xl font-semibold text-white">Launch the DeFiCalc experience when the data stack is ready.</h2>
          <p className="text-base text-slate-300">
            Connect on-chain data, plug in Nova, and invite your team. The UI is primed for static content now and dynamic dashboards
            later.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button href="mailto:hello@deficalc.io" variant="gradient" className="rounded-full px-6 py-3">
              Schedule a walkthrough
            </Button>
            <Button href="#insights" variant="outline" className="rounded-full px-6 py-3">
              View design handoff
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
