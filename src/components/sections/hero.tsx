import Image from "next/image";

import { Button } from "@/components/ui/button";
import { insightHighlights } from "@/lib/site-content";

export function HeroSection() {
  return (
    <section
      id="overview"
      className="relative overflow-hidden border-b border-slate-900/60 bg-hero-grid"
    >
      {/* Base gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-900/40 via-background/90 to-background" aria-hidden />
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-16 px-6 py-24 lg:flex-row lg:items-center">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-mint/30 bg-slate-900/60 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-mint">
            DeFi onboarding made friendly
          </div>
          <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl">
            Make sharper DeFi moves with live market, protocol, and risk analytics in one place.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-300">
            DeFiCalc distills on-chain noise into actionable signals for newcomers and power users alike. Compare
            opportunities, monitor strategies, and collaborate on calculators without leaving your dashboard.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button href="#markets" variant="gradient">
              Explore Dashboard
            </Button>
            <Button href="#protocols" variant="secondary">
              View Market Data
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-3 text-sm text-slate-300">
            {insightHighlights.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-900/80 px-4 py-1"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-mint" aria-hidden />
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="flex w-full flex-1 justify-end lg:justify-center">
          <div className="group relative w-full max-w-md">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 scale-100 rounded-full bg-[radial-gradient(circle,_rgba(59,212,220,0.4)_0%,transparent_68%)] opacity-85 blur-[95px] transition duration-500 group-hover:scale-[1.05] group-hover:opacity-100"
            />
            <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full border border-[#143E66]/45 bg-[conic-gradient(from_140deg_at_50%_50%,#020C16,#072240,#1A164D,#081C32,#020C16)] p-6 shadow-[0_0_85px_-28px_rgba(25,185,205,0.6)] ring-1 ring-inset ring-[#143E66]/55 transition duration-500 before:absolute before:inset-0 before:rounded-full before:bg-[radial-gradient(circle,_rgba(255,255,255,0.28)_0%,transparent_66%)] before:[mask-image:radial-gradient(circle_at_center,transparent_58%,black_70%,black)] before:opacity-65 before:transition before:duration-500 before:content-[''] group-hover:shadow-[0_0_120px_-20px_rgba(59,212,220,0.75)] group-hover:ring-[#1E68A5]/70 group-hover:before:opacity-85 sm:p-8">
              <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(71,166,255,0.18)_0%,transparent_72%)] mix-blend-screen opacity-60 transition duration-500 group-hover:opacity-88" />
              <div className="relative flex h-full w-full items-center justify-center rounded-full border border-[#1C5F93]/35 bg-gradient-to-b from-[#020E17] via-[#031726] to-[#020A11] p-5 ring-1 ring-inset ring-cyan-400/15 shadow-[inset_0_0_55px_-22px_rgba(16,102,176,0.7)] backdrop-blur-md">
                <Image
                  src="/assets/defi-calc-logo-transparent.png"
                  alt="DeFiCalc logo"
                  fill
                  className="object-contain p-3 drop-shadow-[0_26px_60px_rgba(59,212,220,0.6)] transition duration-500 group-hover:scale-110"
                  sizes="(min-width: 1024px) 380px, 100vw"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
