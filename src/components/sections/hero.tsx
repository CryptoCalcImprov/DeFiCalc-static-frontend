import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-slate-900 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-10 px-6 py-24 text-left lg:flex-row lg:items-center lg:gap-16">
        <div className="flex-1">
          <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            Static-first Framework
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Launch a polished crypto landing page without the boilerplate.
          </h1>
          <p className="mt-6 text-lg text-slate-300">
            CryptoCalc.io is a reusable Next.js starter optimized for GitHub Pages. Tailwind CSS and modular
            components help you ship faster while keeping your design cohesive.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button href="#cta">Deploy to GitHub Pages</Button>
            <Button href="#features" variant="ghost">
              Explore Components
            </Button>
          </div>
        </div>
        <div className="flex w-full flex-1 justify-end">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-widest text-slate-400">
              <span>Deployment Checklist</span>
              <span>100%</span>
            </div>
            <ul className="space-y-3 text-sm text-slate-200">
              <li className="flex items-center justify-between">
                <span>Next.js static export</span>
                <span className="text-primary">Ready</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Tailwind component system</span>
                <span className="text-primary">Ready</span>
              </li>
              <li className="flex items-center justify-between">
                <span>GitHub Pages workflow</span>
                <span className="text-primary">Ready</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
