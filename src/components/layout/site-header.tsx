import Link from "next/link";

import { Button } from "@/components/ui/button";
import { navigationLinks } from "@/lib/site-content";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-900/60 bg-slate-950/75 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight text-white">
          <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-2xl bg-slate-900">
            <span className="absolute inset-0 rounded-2xl bg-hero-grid bg-[length:16px_16px] opacity-40" />
            <span className="relative text-lg text-primary">Δ</span>
          </span>
          <span className="leading-tight">
            DeFiCalc
            <span className="block text-xs font-normal uppercase tracking-[0.2em] text-slate-400">Intelligence</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 md:flex">
          {navigationLinks.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button
            href="#toolkit"
            variant="ghost"
            className="hidden border border-slate-800 bg-slate-900/60 px-4 py-2 text-slate-200 hover:border-slate-700 md:inline-flex"
          >
            View Toolkit
          </Button>
          <Button className="bg-gradient-to-r from-primary to-emerald-400 text-slate-950 shadow-glow hover:from-primary/90 hover:to-emerald-400/90">
            Launch App
          </Button>
        </div>
      </div>
    </header>
  );
}
