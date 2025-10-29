import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Scene3D } from "@/components/ui/Scene3D";

export default function AppPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Scene3D />
      <div className="relative z-10 flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex flex-1 items-center justify-center px-6 py-24">
          <div className="max-w-2xl space-y-6 rounded-3xl border border-slate-800/70 bg-slate-950/80 p-10 text-center shadow-lg shadow-cyan-500/10 backdrop-blur">
            <span className="inline-flex items-center justify-center rounded-full border border-mint/30 bg-slate-900/60 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-mint">
              Preview
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              DeFiCalc App workspace is coming soon
            </h1>
            <p className="text-lg leading-relaxed text-slate-300">
              We&apos;re finishing the connected dashboards, calculators, and market monitors. Join the waitlist and be the first to explore the collaborative toolkit when it launches.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="gradient" disabled>
                Join Waitlist
              </Button>
              <Button href="/" variant="secondary">
                Back to Landing
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
