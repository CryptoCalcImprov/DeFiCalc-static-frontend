import Link from "next/link";

import { footerColumns, socialLinks } from "@/lib/site-content";

export function SiteFooter() {
  return (
    <footer id="footer-community" className="mt-20 border-t border-slate-800/70 bg-midnight/90">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[2fr,3fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-300">
              Community-led project
            </div>
            <h2 className="text-2xl font-semibold text-white">Built with and for the DeFi community.</h2>
            <p className="text-sm text-slate-400">
              DeFiCalc is an independent initiative inspired by conversations with the Stohn team. We surface trustworthy analytics,
              invite contributors, and clearly label sponsored placements so users always know what they are looking at.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.title} className="space-y-4 text-sm">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{column.title}</h3>
                <ul className="space-y-2 text-slate-300">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="transition hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-6 border-t border-slate-800/70 pt-8 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} DeFiCalc.io. DeFi analytics concept for exploration purposes.</p>
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <Link key={link.label} href={link.href} className="transition hover:text-white" target="_blank" rel="noreferrer">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <p className="mt-6 text-xs text-slate-500">
          Disclaimer: DeFiCalc is a community experiment and not an official product of the Stohn ecosystem. Analytics shown here
          are illustrative and not investment advice.
        </p>
      </div>
    </footer>
  );
}
