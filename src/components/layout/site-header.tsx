"use client";

import { useState } from "react";
import Link from "next/link";
import { navigationLinks } from "@/lib/site-content";
import clsx from "clsx";

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-900/60 bg-brand-midnight/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-base text-primary">
            DC
          </span>
          <span>
            DeFiCalc.io
            <span className="ml-2 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Community Beta
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 lg:flex">
          {navigationLinks.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="#toolkit"
            className="rounded-full border border-primary/40 px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary hover:text-white"
          >
            View Toolkit
          </a>
          <Link
            href="https://app.deficalc.io"
            className="rounded-full bg-gradient-to-r from-primary to-brand-teal px-4 py-2 text-sm font-semibold text-brand-midnight shadow-glow transition hover:shadow-lg hover:shadow-brand-teal/40"
          >
            Launch App
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 text-slate-200 transition hover:border-primary hover:text-white lg:hidden"
          aria-label="Toggle navigation"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {isOpen ? <MobileMenu onClose={() => setIsOpen(false)} /> : null}
    </header>
  );
}

interface MobileMenuProps {
  onClose: () => void;
}

function MobileMenu({ onClose }: MobileMenuProps) {
  return (
    <div className="lg:hidden">
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-72 flex-col gap-8 border-l border-slate-900/60 bg-brand-midnight/95 p-6 shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-wide text-slate-400">Navigate</span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-800 text-slate-400 transition hover:border-primary hover:text-white"
            aria-label="Close navigation"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" d="M6 6l12 12M18 6l-12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-col gap-4 text-base font-medium text-slate-200">
          {navigationLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="rounded-xl border border-transparent bg-brand-navy/40 px-4 py-3 transition hover:border-primary/50 hover:bg-brand-navy/70"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <a
            href="#toolkit"
            onClick={onClose}
            className="rounded-full border border-primary/40 px-4 py-2 text-center text-sm font-semibold text-primary transition hover:border-primary hover:text-white"
          >
            View Toolkit
          </a>
          <Link
            href="https://app.deficalc.io"
            className={clsx(
              "rounded-full px-4 py-2 text-center text-sm font-semibold text-brand-midnight shadow-glow transition",
              "bg-gradient-to-r from-primary to-brand-teal hover:shadow-lg hover:shadow-brand-teal/40"
            )}
            onClick={onClose}
          >
            Launch App
          </Link>
        </div>
      </aside>
    </div>
  );
}
