import { ReactNode } from "react";

interface SectionProps {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Section({ id, title, description, children, className }: SectionProps) {
  return (
    <section id={id} className={`scroll-mt-24 border-b border-slate-800/60 py-20 ${className ?? ""}`}>
      <div className="mx-auto max-w-6xl px-6">
        <header className="mb-12 max-w-3xl space-y-4">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">{title}</h2>
          {description ? <p className="text-base text-slate-300">{description}</p> : null}
        </header>
        <div className="grid gap-6 text-slate-200">{children}</div>
      </div>
    </section>
  );
}
