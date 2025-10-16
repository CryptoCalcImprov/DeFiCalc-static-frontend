import { Button } from "@/components/ui/button";

export function CallToActionSection() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/40 bg-gradient-to-r from-primary via-highlight to-accent px-10 py-12 text-slate-950 shadow-panel">
      <div className="absolute inset-y-0 right-[-10%] hidden w-1/2 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_60%)] opacity-70 md:block" />
      <div className="relative space-y-6">
        <h3 className="text-3xl font-bold tracking-tight">Launch the next wave of approachable DeFi intelligence.</h3>
        <p className="max-w-2xl text-base text-slate-900/80">
          Ready to move beyond mockups? Connect with the engineering squad to wire live data, or book a design critique to align
          on Nova, calculator sandbox and sponsored placements.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button href="#overview" className="bg-slate-950 text-white hover:bg-slate-900">
            Launch app preview
          </Button>
          <Button href="mailto:design@deficalc.io" variant="ghost" className="border border-slate-900 bg-transparent text-slate-900 hover:bg-white/20">
            Book design review
          </Button>
        </div>
      </div>
    </div>
  );
}
