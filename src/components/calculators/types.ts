import type { FormEvent } from "react";
import type { MonteCarloTrajectoryPoint } from "@/lib/monte-carlo";

export type TimeSeriesPoint = {
  date: string;
  price: number;
};

export type CoinGeckoCandle = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type CalculatorSummaryMetric = {
  label: string;
  value: string | number;
  unit?: string;
};

export type CalculatorSummarySection = {
  type: string;
  headline?: string;
  summary?: string;
  details?: string;
  metrics?: CalculatorSummaryMetric[];
  bullets?: string[];
  assumptions?: string[];
  risks?: string[];
};

export type CalculatorContext = {
  as_of?: string;
  asset?: string;
  inputs?: Record<string, unknown>;
  assumptions?: string[];
  [key: string]: unknown;
};

export type CalculatorInsight = {
  calculator?: {
    id?: string;
    label?: string;
    category?: string;
    version?: string;
  };
  context?: CalculatorContext;
  sections: CalculatorSummarySection[];
  notes?: string[];
};

export type NovaChartData = {
  historical: CoinGeckoCandle[];
  projection: {
    date: string;
    mean: number;
    percentile_10: number;
    percentile_90: number;
  }[];
  metadata?: {
    confidence?: number;
    technical_signals?: Record<string, number>;
  };
};

export type CalculatorResult = {
  insight: CalculatorInsight | null;
  dataset: TimeSeriesPoint[];
  fallbackSummary?: string;
  fallbackLines?: string[];
  strategyOverlays?: StrategyOverlay[];
  chartData?: NovaChartData;
};

export type ChartProjectionMetadata = {
  asset: string;
  as_of: string;
  projection_horizon_months: number;
};

export type ChartProjectionData = {
  historical_data: CoinGeckoCandle[];
  projection: MonteCarloTrajectoryPoint[];
  metadata: ChartProjectionMetadata;
};

export type StrategyOverlayPoint = {
  date: string;
  price: number;
};

export type StrategyOverlay = {
  id: string;
  label: string;
  type: "buy" | "sell" | "annotation";
  points: StrategyOverlayPoint[];
  metadata?: Record<string, unknown>;
};

export type CalculatorFormChangeHandler<FormState> = <Field extends keyof FormState>(
  field: Field,
  value: FormState[Field],
) => void;

export type CalculatorFormProps<FormState> = {
  formState: FormState;
  onFormStateChange: CalculatorFormChangeHandler<FormState>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  error: string | null;
};

export type CalculatorRequestConfig = {
  prompt: string;
  options?: Partial<RequestInit>;
  chartProjection?: ChartProjectionData;
};

export type CalculatorDefinition<FormState> = {
  id: string;
  label: string;
  description?: string;
  Form: (props: CalculatorFormProps<FormState>) => JSX.Element;
  getInitialState: () => FormState;
  getRequestConfig: (
    formState: FormState,
    chartProjection?: ChartProjectionData,
    extras?: Record<string, unknown>,
  ) => CalculatorRequestConfig;
  parseReply: (reply: string) => CalculatorResult;
  getSeriesLabel?: (formState: FormState) => string;
  initialSummary?: string;
  pendingSummary?: string;
};
