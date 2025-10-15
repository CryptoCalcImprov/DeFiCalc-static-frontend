import { ReactNode } from "react";
import clsx from "clsx";

interface SectionProps {
  id?: string;
  title: string;
  description?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}

export function Section({ id, title, description, eyebrow, children, className }: SectionProps) {
  return (
    <section
      id={id}
      className={clsx(
        "scroll-mt-24 border-t border-slate-900/70 bg-slate-950/60 py-16",
        className
      )}
    >
      <div className="mx-auto max-w-6xl px-6">
        <header className="mb-12 max-w-2xl">
          {eyebrow ? (
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              {eyebrow}
            </span>
          ) : null}
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h2>
          {description ? <p className="mt-4 text-base text-slate-300">{description}</p> : null}
        </header>
        <div className="grid gap-8 text-slate-100">{children}</div>
      </div>
    </section>
  );
}
