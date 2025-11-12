import type { TimeSeriesPoint } from "@/components/calculators/types";

export type HistoryStats = {
  startDate: string;
  endDate: string;
  sampleCount: number;
  totalReturn: number;
  annualizedDrift: number;
  annualizedVolatility: number;
};

export type ProjectionPoint = TimeSeriesPoint;

export type AnalysisMetric = {
  id: string;
  label: string;
  value: number;
  unit?: string;
};

export type HistoryAnalysis = {
  stats: HistoryStats;
  series: TimeSeriesPoint[];
};

export type BaseProjection = {
  path: ProjectionPoint[];
};

export type AnalysisPackage<Projection extends BaseProjection = BaseProjection> = {
  history: HistoryAnalysis;
  projection: Projection;
  metrics: AnalysisMetric[];
};

export type DcaSimulationOptions = {
  contributionUsd: number;
  intervalDays: number;
  durationDays: number;
};

export type DcaScheduleEntry = {
  date: string;
  price: number;
  contribution: number;
  units: number;
  cumulativeUnits: number;
  cumulativeCost: number;
  costBasis: number;
};

export type DcaProjection = BaseProjection & {
  schedule: DcaScheduleEntry[];
  totalContribution: number;
  projectedHoldings: number;
  projectedValue: number;
};

export type DcaAnalysisPackage = AnalysisPackage<DcaProjection>;

export type BuyTheDipSimulationOptions = {
  totalBudgetUsd: number;
  dipThreshold: number;
  lookbackWindowDays: number;
  projectionWindowDays: number;
};

export type DipTrigger = {
  date: string;
  drawdown: number;
  price: number;
};

export type DipWindow = {
  windowStart: string;
  windowEnd: string;
  allocation: number;
  expectedPrice: number;
};

export type BuyTheDipProjection = BaseProjection & {
  triggers: DipTrigger[];
  projectedWindows: DipWindow[];
  remainingBudget: number;
};

export type BuyTheDipAnalysisPackage = AnalysisPackage<BuyTheDipProjection>;

export type TrendFollowingSimulationOptions = {
  initialCapitalUsd: number;
  shortWindow: number;
  longWindow: number;
  projectionWindowDays: number;
};

export type TrendState = {
  date: string;
  shortMa: number | null;
  longMa: number | null;
  position: "long" | "flat";
};

export type TrendProjection = BaseProjection & {
  states: TrendState[];
  strategyEquity: number;
  hodlEquity: number;
};

export type TrendFollowingAnalysisPackage = AnalysisPackage<TrendProjection>;

export type { TimeSeriesPoint } from "@/components/calculators/types";
