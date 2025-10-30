import { AppHeader } from "@/components/layout/app-header";
import { DcaCalculatorSection } from "@/components/sections/dca-calculator";
import { Scene3D } from "@/components/ui/Scene3D";
import { NovaAssistant } from "@/components/ui/nova-assistant";

export default function AppPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Scene3D />
      <div className="relative z-10 flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 px-6 py-16 lg:py-20">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex items-center rounded-full border border-mint/30 bg-slate-900/60 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-mint">
                Nova Workspace
              </span>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Model strategies with Nova&apos;s calculator library
              </h1>
              <p className="text-lg leading-relaxed text-slate-300">
                Choose from pre‑built calculators—including DCA and more—to quickly project your strategy. Configure
                cadence, contribution size, and horizon, then run the scenario to review Nova&apos;s summary and visualize
                the modeled price path before committing capital.
              </p>
            </div>
            <div id="calculators">
              <DcaCalculatorSection />
            </div>
          </div>
        </main>
        <NovaAssistant />
      </div>
    </div>
  );
}
