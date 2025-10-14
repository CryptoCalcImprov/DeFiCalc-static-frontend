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
    <section id={id} className={`scroll-mt-20 border-b border-slate-900 py-16 ${className ?? ""}`}>
      <div className="mx-auto max-w-5xl px-6">
        <header className="mb-10 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-white">{title}</h2>
          {description ? <p className="mt-3 text-base text-slate-300">{description}</p> : null}
        </header>
        <div className="grid gap-6 text-slate-200">{children}</div>
      </div>
    </section>
  );
}
