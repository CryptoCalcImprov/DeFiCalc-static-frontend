"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { navigationLinks } from "@/lib/site-content";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/assets/defi-calc-logo-transparent-mini.png"
            alt="DeFiCalc.io"
            width={120}
            height={32}
            style={{ width: "auto", height: "32px" }}
            priority
          />
          <span className="bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 bg-clip-text text-lg font-semibold tracking-tight text-transparent">
            DeFiCalc.io
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-200 lg:flex">
          {navigationLinks.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Button href="#toolkit" variant="secondary" className="text-sm">
            View Toolkit
          </Button>
          <Button href="#launch" variant="gradient" className="text-sm shadow-primary/30">
            Launch App
          </Button>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-slate-800/70 bg-slate-900/60 p-2 text-slate-200 transition hover:bg-slate-900 lg:hidden"
          aria-label="Toggle navigation menu"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <svg
            className={`h-5 w-5 transition-transform ${menuOpen ? "rotate-90" : "rotate-0"}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            {menuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path
                d="M4 7h16M4 12h16M4 17h16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </button>
      </div>
      {menuOpen ? (
        <div className="border-t border-slate-800/70 bg-slate-950/95 py-6 lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6">
            <nav className="grid gap-4 text-base font-medium text-slate-100">
              {navigationLinks.map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:text-primary" onClick={() => setMenuOpen(false)}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col gap-3">
              <Button href="#toolkit" variant="secondary" className="w-full" onClick={() => setMenuOpen(false)}>
                View Toolkit
              </Button>
              <Button href="#launch" variant="gradient" className="w-full" onClick={() => setMenuOpen(false)}>
                Launch App
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
