import type { ReactNode } from "react";

type CalculatorWorkspaceProps = {
  calculatorPanel: ReactNode;
  summaryPanel: ReactNode;
  chartPanel: ReactNode;
  controls?: ReactNode;
  className?: string;
};

export function CalculatorWorkspace({
  calculatorPanel,
  summaryPanel,
  chartPanel,
  controls,
  className,
}: CalculatorWorkspaceProps) {
  return (
    <div className={["flex flex-col gap-6 lg:gap-8", className].filter(Boolean).join(" ")}>
      {controls ? <div className="flex items-center justify-between">{controls}</div> : null}
      <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-8">
        {calculatorPanel}
        {summaryPanel}
      </div>
      {chartPanel}
    </div>
  );
}
