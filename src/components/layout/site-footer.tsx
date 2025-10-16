import Link from "next/link";
import { footerColumns, socialLinks } from "@/lib/site-content";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-900 bg-brand-midnight">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-tight text-white">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">DC</span>
              DeFiCalc.io
            </Link>
            <p className="text-sm text-slate-400">
              DeFiCalc is a community-led initiative creating a friendly gateway into decentralized finance analytics. We are not officially affiliated with Stohn, but we share the mission of responsible DeFi exploration.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 text-slate-400 transition hover:border-primary hover:text-white"
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          {footerColumns.map((column) => (
            <div key={column.title} className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{column.title}</p>
              <ul className="space-y-2 text-sm text-slate-400">
                {column.links.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="transition hover:text-white"
                      target={item.href.startsWith("http") || item.href.startsWith("mailto") ? "_blank" : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-slate-900/60 pt-6 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} DeFiCalc.io. Built by the community for analysts, builders and explorers. Data is for educational purposes; always verify on-chain metrics before acting.
          </p>
        </div>
      </div>
    </footer>
  );
}
