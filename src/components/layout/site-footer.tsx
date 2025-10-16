import Link from "next/link";

import { footerColumns, socialLinks } from "@/lib/site-content";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-900/60 bg-slate-950/80">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="space-y-3 text-sm text-slate-300">
            <span className="text-lg font-semibold text-white">DeFiCalc.io</span>
            <p>
              Community-built intelligence for the next wave of DeFi explorers. Not officially affiliated with the Stohn
              ecosystem.
            </p>
            <div className="flex gap-4 text-sm text-slate-400">
              {socialLinks.map((link) => (
                <Link key={link.href} href={link.href} className="transition hover:text-mint">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          {footerColumns.map((column) => (
            <div key={column.title} className="space-y-3 text-sm text-slate-400">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">{column.title}</h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="transition hover:text-mint"
                      target={'external' in link && link.external ? "_blank" : undefined}
                      rel={'external' in link && link.external ? "noreferrer" : undefined}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-slate-900/60 pt-8 text-xs text-slate-500">
          <p>&copy; {year} DeFiCalc.io. Crafted by community members for educational purposes.</p>
          <p className="mt-2">DeFi insights are not financial advice. DYOR and consult professionals before deploying capital.</p>
        </div>
      </div>
    </footer>
  );
}
