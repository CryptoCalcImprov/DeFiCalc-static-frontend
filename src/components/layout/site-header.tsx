"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";

import { navigationLinks } from "@/lib/site-content";
import { Button } from "@/components/ui/button";

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-midnight-300/20 text-slate-200 ring-1 ring-inset ring-slate-700/40 transition hover:text-white">
      {open ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
          <path
            d="M6 6l12 12M6 18L18 6"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
        </svg>
      )}
    </span>
  );
}

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-800/70 bg-midnight/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/70 to-secondary/70 text-sm font-bold text-white shadow-glow">
              DC
            </span>
            <span>DeFiCalc.io</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-200 lg:flex">
            {navigationLinks.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <Button href="#toolkit" variant="outline" className="rounded-full px-5">
              View Toolkit
            </Button>
            <Button href="#launch" variant="gradient" className="rounded-full px-5">
              Launch App
            </Button>
          </div>
          <button
            type="button"
            className="lg:hidden"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="Toggle navigation"
            aria-expanded={isOpen}
          >
            <MenuIcon open={isOpen} />
          </button>
        </div>
        <div
          className={clsx(
            "lg:hidden",
            "overflow-hidden border-t border-slate-800/70 bg-midnight/95 shadow-xl transition-[max-height,opacity] duration-300",
            isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <nav className="flex flex-col gap-2 px-6 py-4 text-sm font-medium text-slate-200">
            {navigationLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 transition hover:bg-midnight-300/40 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Button href="#toolkit" variant="outline" className="rounded-full px-5">
              View Toolkit
            </Button>
          </nav>
        </div>
      </header>
      <div className="fixed bottom-6 right-6 z-40 sm:hidden">
        <Button href="#launch" variant="gradient" className="rounded-full px-5 py-3 shadow-card">
          Launch App
        </Button>
      </div>
    </>
  );
}
