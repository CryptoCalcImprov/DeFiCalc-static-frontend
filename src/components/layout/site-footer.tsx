import Link from "next/link";

import { footerLinks } from "@/lib/site-content";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
        <p>&copy; {new Date().getFullYear()} CryptoCalc.io. All rights reserved.</p>
        <div className="flex items-center gap-4">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-primary-foreground" target="_blank">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
