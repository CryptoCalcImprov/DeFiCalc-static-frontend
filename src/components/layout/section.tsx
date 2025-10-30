import { ReactNode } from "react";

interface SectionProps {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Section({ id, title, description, children, className }: SectionProps) {
  const headingId = id ? `${id}-title` : undefined;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`relative scroll-mt-24 border-b border-slate-800/45 py-20 ${className ?? ""}`}
    >
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 20% 18%, rgba(122,64,255,0.24), transparent 58%), radial-gradient(circle at 80% 82%, rgba(58,198,255,0.2), transparent 55%), linear-gradient(180deg, rgba(6,21,34,0.92) 0%, rgba(6,21,34,0.75) 100%)",
        }}
        aria-hidden
      />
      <div className="mx-auto max-w-6xl px-6">
        <header className="mb-12 max-w-3xl">
          <h2 id={headingId} className="text-4xl font-semibold tracking-tight">
            {title}
          </h2>
          {description ? <p className="mt-4 text-lg leading-relaxed text-slate-300">{description}</p> : null}
        </header>
        <div className="grid gap-8 text-slate-200">{children}</div>
      </div>
    </section>
  );
}
