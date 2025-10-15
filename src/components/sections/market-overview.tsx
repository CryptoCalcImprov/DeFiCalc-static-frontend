import { marketStats } from "@/lib/site-content";

export function MarketOverviewSection() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {marketStats.map((stat) => (
        <article
          key={stat.label}
          className="relative overflow-hidden rounded-3xl border border-slate-900/70 bg-slate-950/80 p-6 shadow-lg shadow-slate-950/40"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-70" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">{stat.label}</p>
            <p className="mt-4 text-3xl font-semibold text-white">{stat.value}</p>
            <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
              <span>{stat.caption}</span>
              <span
                className={stat.trend === "up" ? "text-emerald-400" : "text-rose-400"}
              >
                {stat.delta}
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
