export type TrendFollowingDataPoint = {
  date: string;
  price: number;
  ma: number;
  portfolioEquity: number;
  hodlValue: number;
};

export type TrendFollowingCrossoverPoint = {
  date: string;
  price: number;
  signal: "enter" | "exit";
};

export type TrendFollowingSimulationMetrics = {
  totalReturnPct: number;
  sharpe: number;
  maxDrawdownPct: number;
  timeInMarketPct: number;
  crossoverCount: number;
};

export type TrendFollowingSimulation = {
  dataset: TrendFollowingDataPoint[];
  crossovers: TrendFollowingCrossoverPoint[];
  metrics: TrendFollowingSimulationMetrics;
};
