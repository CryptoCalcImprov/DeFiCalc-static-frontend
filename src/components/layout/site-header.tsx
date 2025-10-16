"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";

import { Button } from "@/components/ui/button";
import { navigationLinks } from "@/lib/site-content";

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-midnight/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-white transition hover:text-accent"
          onClick={() => setIsOpen(false)}
        >
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">DeFiCalc.io</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-slate-200 lg:flex">
          {navigationLinks.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Button href="#toolkit" variant="outline">
            View Toolkit
          </Button>
          <Button href="#cta" variant="gradient">
            Launch App
          </Button>
        </div>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="mobile-nav"
          onClick={() => setIsOpen((value) => !value)}
          className="inline-flex items-center justify-center rounded-full border border-slate-700/70 p-2 text-slate-200 transition hover:border-slate-500 hover:text-white lg:hidden"
        >
          {isOpen ? <CloseIcon /> : <MenuIcon />}
          <span className="sr-only">Toggle navigation</span>
        </button>
      </div>
      <div
        id="mobile-nav"
        className={clsx(
          "overflow-hidden border-t border-slate-800/60 bg-deep/90 backdrop-blur transition-[max-height] duration-300 lg:hidden",
          isOpen ? "max-h-96" : "max-h-0"
        )}
      >
        <div className="space-y-4 px-6 py-6">
          <nav className="flex flex-col gap-4 text-sm text-slate-200">
            {navigationLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-transparent bg-white/5 px-4 py-2 transition hover:border-accent/60 hover:bg-white/10"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-3">
            <Button href="#toolkit" variant="outline" className="justify-center">
              View Toolkit
            </Button>
            <Button href="#cta" variant="gradient" className="justify-center">
              Launch App
            </Button>
          </div>
        </div>
      </div>
      <Button href="#cta" variant="gradient" className="fixed bottom-6 right-4 z-40 shadow-panel sm:hidden">
        Launch App
      </Button>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
