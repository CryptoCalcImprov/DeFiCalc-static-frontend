"use client";

type CalculatorSwitcherProps = {
  calculators: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
  activeId: string;
  onChange: (id: string) => void;
};

export function CalculatorSwitcher({ calculators, activeId, onChange }: CalculatorSwitcherProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-ocean/50 bg-slate-950/60 px-4 py-2">
      <span className="text-xs font-semibold uppercase tracking-widest text-mint">Calculators</span>
      <div className="relative">
        <select
          className="rounded-xl border border-ocean/60 bg-surface/80 px-3 py-1.5 text-sm text-slate-50 focus:border-mint focus:bg-surface/95 focus:outline-none focus:ring-1 focus:ring-mint/35 sm:text-base"
          value={activeId}
          onChange={(event) => onChange(event.target.value)}
        >
          {calculators.map((calculator) => (
            <option key={calculator.id} value={calculator.id}>
              {calculator.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
