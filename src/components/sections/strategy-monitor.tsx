import { strategyMonitorEntries } from "@/lib/site-content";

const toneStyles: Record<string, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger"
};

export function StrategyMonitor() {
  return (
    <div className="relative w-full max-w-lg rounded-3xl border border-slate-800/70 bg-abyss/80 p-6 shadow-panel">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Strategy monitor</p>
          <p className="mt-1 text-sm text-slate-300">Live refresh every 60s once connected</p>
        </div>
        <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
          Preview
        </span>
      </div>
      <ul className="space-y-4">
        {strategyMonitorEntries.map((strategy) => (
          <li key={strategy.name} className="rounded-2xl border border-slate-800/60 bg-deep/80 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{strategy.name}</span>
                  <span className="rounded-full border border-slate-700/60 bg-slate-900/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    {strategy.chain}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">{strategy.note}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneStyles[strategy.riskTone]}`}>
                {strategy.riskLabel}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-3">
                <dt className="text-[10px] uppercase tracking-widest text-slate-500">Net APR</dt>
                <dd className="mt-1 text-base font-semibold text-white">{strategy.netApr}%</dd>
              </div>
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-3">
                <dt className="text-[10px] uppercase tracking-widest text-slate-500">Rewards</dt>
                <dd className="mt-1 text-sm font-medium text-slate-200">{strategy.rewards}</dd>
              </div>
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-3">
                <dt className="text-[10px] uppercase tracking-widest text-slate-500">Health</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <span className="text-base font-semibold text-white">{strategy.health}</span>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">/100</span>
                </dd>
              </div>
            </dl>
            <div className="mt-4">
              <div className="h-2 w-full rounded-full bg-slate-800/80">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-accent to-primary`}
                  style={{ width: `${strategy.health}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Risk model weighted by volatility + utilisation</span>
                <span>Alerts ready</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
