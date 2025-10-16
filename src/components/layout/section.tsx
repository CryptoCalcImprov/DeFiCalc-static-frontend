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
    <section id={id} className={`scroll-mt-24 border-b border-slate-900/60 py-20 ${className ?? ""}`}>
      <div className="mx-auto max-w-6xl px-6">
        <header className="mb-12 max-w-3xl">
          <h2 className="text-4xl font-semibold tracking-tight text-white">{title}</h2>
          {description ? <p className="mt-4 text-lg leading-relaxed text-slate-300">{description}</p> : null}
        </header>
        <div className="grid gap-8 text-slate-200">{children}</div>
      </div>
    </section>
  );
}
