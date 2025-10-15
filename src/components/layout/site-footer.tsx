import Link from "next/link";

import { footerLinks } from "@/lib/site-content";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-base font-semibold text-white">DeFiCalc.io</p>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-slate-500">DeFi intelligence for builders</p>
          <p className="mt-4">&copy; {new Date().getFullYear()} DeFiCalc Labs. All rights reserved.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-primary" target="_blank">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
