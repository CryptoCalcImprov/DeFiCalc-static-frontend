import Link from "next/link";

import { footerColumns, socialLinks } from "@/lib/site-content";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-800/60 bg-abyss/95 text-sm text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-5">
        <div className="space-y-4">
          <div>
            <span className="text-lg font-semibold text-white">DeFiCalc.io</span>
            <p className="mt-3 text-xs text-slate-400">
              Community-built analytics hub providing friendly pathways into DeFi. Not an official Stohn product — built with
              love by contributors.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {socialLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700/80 bg-white/5 text-slate-200 transition hover:border-accent/70 hover:text-white"
                aria-label={link.label}
              >
                <SocialIcon name={link.label} />
              </Link>
            ))}
          </div>
        </div>
        {footerColumns.map((column) => (
          <div key={column.title} className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-400">{column.title}</h4>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-300 transition hover:text-white"
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noreferrer" : undefined}
                  >
                    {link.label}
                    {link.external ? <span className="ml-1 text-xs text-slate-500">↗</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-800/60 bg-midnight/60">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>&copy; {new Date().getFullYear()} DeFiCalc.io. Crafted by the community.</p>
          <p className="text-left sm:text-right">
            Sponsored placements are clearly labelled. Always do your own research before deploying capital.
          </p>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ name }: { name: string }) {
  if (name === "Twitter") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
        <path
          d="M20.94 5.34c-.7.31-1.43.52-2.2.62.79-.48 1.4-1.25 1.69-2.16-.73.45-1.54.78-2.4.95a3.68 3.68 0 0 0-6.27 3.35 10.45 10.45 0 0 1-7.6-3.85 3.67 3.67 0 0 0 1.14 4.9 3.64 3.64 0 0 1-1.66-.46v.05a3.68 3.68 0 0 0 2.95 3.6c-.33.09-.68.13-1.04.13-.25 0-.5-.02-.74-.07a3.7 3.7 0 0 0 3.43 2.55A7.38 7.38 0 0 1 3 18.27 10.41 10.41 0 0 0 8.65 20c6.39 0 9.89-5.29 9.89-9.88 0-.15 0-.29-.01-.44a7.05 7.05 0 0 0 1.71-1.79z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (name === "Discord") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
        <path
          d="M20 4.5a18.5 18.5 0 0 0-4.7-1.5l-.22.45c1.13.27 2.18.66 3.16 1.2-1.34-.63-2.77-1-4.24-1.2a.52.52 0 0 0-.09 0c-.1 0-.2 0-.3.02a.2.2 0 0 0-.09.02 18.7 18.7 0 0 0-4.23 1.2c-.02.01-.04.02-.05.03.98-.54 2.03-.93 3.16-1.2L11.3 3A18.4 18.4 0 0 0 6.6 4.5C3.8 8.68 3 12.74 3.3 16.74c1.78 1.32 3.5 2.13 5.2 2.65l.67-.93a12.5 12.5 0 0 1-2.05-.99l.5-.38c1.98.92 3.96.92 5.92 0l.5.38c-.66.4-1.35.73-2.06.99l.68.93c1.7-.52 3.42-1.33 5.2-2.65.43-4.79-.46-8.8-2.86-12.14ZM9.1 14.77c-.81 0-1.48-.73-1.48-1.63 0-.9.64-1.63 1.47-1.63.84 0 1.5.74 1.48 1.63 0 .9-.64 1.63-1.47 1.63Zm5.8 0c-.82 0-1.48-.73-1.48-1.63 0-.9.65-1.63 1.48-1.63.83 0 1.48.74 1.48 1.63 0 .9-.65 1.63-1.48 1.63Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M9 19c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2h-1v-5h1.5l.5-2H14V9.5c0-.58.18-.98 1.04-.98H15V7.1c-.18-.02-.7-.07-1.33-.07-1.57 0-2.64.86-2.64 2.44V12H9.5v2H11v5H9Z"
        fill="currentColor"
      />
    </svg>
  );
}
