"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { publicAsset } from "@/lib/public-asset";

export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
          <span className="relative h-8 w-[90px]">
            <Image
              src={publicAsset("/assets/defi-calc-logo-transparent-mini.png")}
              alt="DeFiCalc.io"
              fill
              sizes="90px"
              className="object-contain"
              priority
            />
          </span>
          <span className="bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 bg-clip-text text-lg font-semibold tracking-tight text-transparent">
            DeFiCalc.io
          </span>
        </Link>
        <div className="hidden items-center gap-3 lg:flex">
          <Button href="/" variant="ghost" className="text-sm text-slate-200 hover:text-white">
            Exit App
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
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
        </button>
      </div>
      {menuOpen ? (
        <div className="border-t border-slate-800/70 bg-slate-950/95 py-6 lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6">
            <Button href="/" variant="ghost" className="w-full" onClick={() => setMenuOpen(false)}>
              Exit App
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
