import { marketPulse } from "@/lib/site-content";

export function MarketPulseSection() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {marketPulse.totals.map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-slate-800/70 bg-slate-950 p-5">
            <p className="text-xs uppercase tracking-widest text-slate-500">{stat.label}</p>
            <p className="mt-3 text-2xl font-semibold text-white">{stat.value}</p>
            <p className="mt-1 text-sm text-mint">{stat.change}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800/70 bg-slate-950 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Trending pairs</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-200">
            {marketPulse.trending.map((item) => (
              <li key={item.name} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.metric}</p>
                </div>
                <span className="text-mint">{item.change}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-800/70 bg-slate-950 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Alerts</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-200">
            {marketPulse.alerts.map((alert) => (
              <li key={alert.title} className="rounded-2xl border border-slate-800/70 bg-slate-900 p-4">
                <p className="font-medium text-white">{alert.title}</p>
                <p className="mt-1 text-xs text-slate-400">{alert.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
