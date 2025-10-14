import Link from "next/link";

import { navigationLinks } from "@/lib/site-content";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-primary">
          CryptoCalc.io
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-300">
          {navigationLinks.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-primary-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
