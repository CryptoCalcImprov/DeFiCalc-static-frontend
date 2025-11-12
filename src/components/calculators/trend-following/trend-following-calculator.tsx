"use client";

import type { ChangeEvent } from "react";

import type {
  CalculatorDefinition,
  CalculatorFormProps,
  CalculatorResult,
} from "@/components/calculators/types";
import { buildFieldChangeHandler } from "@/components/calculators/utils/forms";
import { joinPromptLines } from "@/components/calculators/utils/prompt";
import { parseCalculatorReply } from "@/components/calculators/utils/summary";
import { buildNovaRequestOptions } from "@/components/calculators/utils/request";
import { TokenSelector } from "@/components/calculators/workspace/TokenSelector";
import type { CoindeskAsset } from "@/hooks/useCoindeskAssetSearch";
import {
  fetchCoindeskHistoryWithSummary,
  type CoindeskHistoryResult,
} from "@/lib/coindesk-history";
import { resolveDurationDays } from "@/components/calculators/utils/duration";
import {
  getCurrentUtcClockInfo,
  type UtcClockInfo,
} from "@/components/calculators/utils/clock";
import {
  simulateTrendFollowing,
  type TrendFollowingAnalysisPackage,
} from "@/components/calculators/utils/modeling";

export type TrendFollowingFormState = {
  token: string;
  tokenName: string;
  market: string;
  initialCapital: string;
  maPeriod: string;
  duration: string;
};

const DEFAULT_MARKET = "cadli";
const DEFAULT_TOKEN_NAME = "Bitcoin";
const DURATION_TO_DAYS: Record<string, number> = {
  "6 months": 180,
  "1 year": 365,
  "2 years": 730,
  "3 years": 1095,
};
const DEFAULT_DURATION_DAYS = DURATION_TO_DAYS["1 year"];

const defaultFormState: TrendFollowingFormState = {
  token: "BTC",
  tokenName: DEFAULT_TOKEN_NAME,
  market: DEFAULT_MARKET,
  initialCapital: "10000",
  maPeriod: "50",
  duration: "1 year",
};

const initialSummaryMessage = "Run the projection to see Nova's analysis of this trend-following strategy.";
const pendingSummaryMessage = "Generating Nova's latest projection...";

type TrendModelingArtifacts = {
  historyHighlights: TrendFollowingAnalysisPackage["history"];
  projectionSeries: TrendFollowingAnalysisPackage["projection"];
  strategyMetrics: TrendFollowingAnalysisPackage["metrics"];
  initialCapitalUsd: number;
  shortWindow: number;
  longWindow: number;
  projectionWindowDays: number;
};

function formatNumber(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const absolute = Math.abs(value);
  if (absolute >= 1000) {
    return Number(value.toFixed(2));
  }
  if (absolute >= 1) {
    return Number(value.toFixed(4));
  }
  return Number(value.toFixed(6));
}

function sampleTrendStates(states: TrendFollowingAnalysisPackage["projection"]["states"], target = 40) {
  if (states.length <= target) {
    return states;
  }
  const step = Math.ceil(states.length / target);
  const sampled = states.filter((_, index) => index % step === 0);
  if (sampled[sampled.length - 1]?.date !== states[states.length - 1]?.date) {
    sampled[sampled.length - 1] = states[states.length - 1];
  }
  return sampled.slice(0, target);
}

function buildPrompt(
  { token, tokenName, initialCapital, maPeriod, duration }: TrendFollowingFormState,
  history: CoindeskHistoryResult,
  clock: UtcClockInfo,
  modeling: TrendModelingArtifacts,
) {
  const resolvedTokenName = tokenName?.trim() || token;
  const {
    historyHighlights,
    projectionSeries,
    strategyMetrics,
    initialCapitalUsd,
    shortWindow,
    longWindow,
    projectionWindowDays,
  } = modeling;

  const analysisPackage = {
    context: {
      calculator: {
        id: "trend-following",
        label: "Trend-Following",
      },
      clock: {
        as_of_date: clock.currentUtcDate,
        as_of_timestamp: clock.currentUtcIso,
      },
      market: {
        symbol: history.symbol ?? token,
        instrument: history.instrument,
        venue: history.market,
        token_name: resolvedTokenName,
      },
      inputs: {
        initial_capital_usd: formatNumber(initialCapitalUsd),
        moving_average_period: Number.parseInt(maPeriod, 10) || longWindow,
        short_window_days: shortWindow,
        long_window_days: longWindow,
        duration,
        duration_days: projectionWindowDays,
      },
    },
    history: {
      summary: history.summary,
      stats: {
        start: historyHighlights.stats.startDate,
        end: historyHighlights.stats.endDate,
        samples: historyHighlights.stats.sampleCount,
        total_return: formatNumber(historyHighlights.stats.totalReturn),
        annualized_drift: formatNumber(historyHighlights.stats.annualizedDrift),
        annualized_volatility: formatNumber(historyHighlights.stats.annualizedVolatility),
      },
      sample_series: historyHighlights.series.map((point) => ({
        date: point.date,
        price: formatNumber(point.price),
      })),
    },
    projection: {
      strategy_equity: formatNumber(projectionSeries.strategyEquity),
      hodl_equity: formatNumber(projectionSeries.hodlEquity),
      states_sample: sampleTrendStates(projectionSeries.states).map((state) => ({
        date: state.date,
        short_ma: state.shortMa === null ? null : formatNumber(state.shortMa),
        long_ma: state.longMa === null ? null : formatNumber(state.longMa),
        position: state.position,
      })),
      path: projectionSeries.path.map((point) => ({
        date: point.date,
        price: formatNumber(point.price),
      })),
    },
    metrics: strategyMetrics.map((metric) => ({
      id: metric.id,
      label: metric.label,
      value: formatNumber(metric.value),
      ...(metric.unit ? { unit: metric.unit } : {}),
    })),
  };

  const analysisJson = JSON.stringify(analysisPackage, null, 2);

  return joinPromptLines([
    "You are Nova, a quant researcher assessing a trend-following crypto strategy.",
    "Use only the provided data. Do not call external tools, request clarification, or defer your answer.",
    "",
    `analysisPackage = ${analysisJson}`,
    "",
    "Use analysisPackage to craft your response:",
    "1. Summarize performance versus a HODL baseline referencing strategy_equity, hodl_equity, and metrics.",
    "2. Stress-test the moving-average assumptions; explain sensitivities observed in states_sample within assumptions arrays.",
    "3. Highlight material risks, regime shifts, and monitoring cues using history stats and current positioning.",
    "",
    "Response constraints:",
    "- Return a single JSON object matching the schema below.",
    "- Populate every numeric field with explicit numbers.",
    "- Do not include commentary outside the JSON payload.",
    "",
    "Schema:",
    "{",
    '  "insight": {',
    '    "calculator": {',
    '      "id": "trend-following",',
    '      "label": "Trend-Following",',
    '      "category": "momentum_strategy",',
    '      "version": "v1"',
    "    },",
    '    "context": {',
    '      "as_of": "YYYY-MM-DD",',
    `      "asset": "${token}",`,
    '      "inputs": {',
    `        "initial_capital_usd": ${initialCapital},`,
    `        "moving_average_period": ${maPeriod},`,
    `        "duration": "${duration}"`,
    "      },",
    '      "analysis_reference": ["projection.strategy_equity", "projection.states_sample"],',
    '      "assumptions": ["Document key modeling choices and stress-test outcomes."]',
    "    },",
    '    "sections": [',
    "      {",
    '        "type": "performance",',
    '        "headline": "Performance snapshot",',
    '        "summary": "Compare trend strategy outcomes against HODL and note standout drivers.",',
    '        "metrics": [',
    '          { "label": "Strategy total return (%)", "value": 12.5 },',
    '          { "label": "Strategy Sharpe", "value": 0.92 },',
    '          { "label": "Strategy max drawdown (%)", "value": -18.4 }',
    "        ],",
    '        "assumptions": ["Capture the stress-test insight or scenario comparison."],',
    '        "risks": ["Highlight sensitivities to volatility or whipsaws."]',
    "      },",
    "      {",
    '        "type": "trade_flow",',
    '        "headline": "Trade cadence & positioning",',
    '        "summary": "Explain crossover frequency, time in market, and positioning shifts.",',
    '        "metrics": [',
    '          { "label": "Time in market (%)", "value": 64 },',
    '          { "label": "Major crossover count", "value": 14 }',
    "        ],",
    '        "assumptions": ["Summarize scenario comparisons or stress-tested adjustments."],',
    '        "risks": ["Flag execution or slippage concerns revealed by the stress test."]',
    "      },",
    "      {",
    '        "type": "risk",',
    '        "headline": "Risk outlook",',
    '        "summary": "List regime-change, liquidity, or operational risks to monitor.",',
    '        "risks": ["List each material risk in plain language."],',
    '        "assumptions": ["Capture mitigations or monitoring guidance."]',
    "      }",
    "    ],",
    '    "notes": ["Optional reminders or next steps."]',
    "  },",
    '  "series": [',
    "    {",
    '      "id": "trend_price_equity",',
    '      "label": "Modeled price & equity",',
    '      "points": [',
    '        { "date": "YYYY-MM-DD", "price": 123.45 }',
    "      ]",
    "    }",
    "  ]",
    "}",
    "",
    "Strictly follow the schema. Do not emit trailing text or additional keys.",
  ]);
}

function parseNovaReply(reply: string): CalculatorResult {
  return parseCalculatorReply(reply);
}

export function TrendFollowingCalculatorForm({
  formState,
  onFormStateChange,
  onSubmit,
  isLoading,
  error,
}: CalculatorFormProps<TrendFollowingFormState>) {
  const handleFieldChangeBuilder = buildFieldChangeHandler<TrendFollowingFormState>(onFormStateChange);

  const handleFieldChange =
    (field: keyof TrendFollowingFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      handleFieldChangeBuilder(field)(event.target.value);
    };

  return (
    <form
      className="card-surface flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-slate-950/75 via-slate-950/55 to-slate-900/30 p-4 sm:gap-5 sm:rounded-3xl sm:p-6"
      onSubmit={onSubmit}
    >
      <div>
        <h3 className="text-lg font-semibold text-slate-50 sm:text-xl">Configure your trend-following strategy</h3>
        <p className="mt-1.5 text-xs text-muted sm:mt-2 sm:text-sm">
          Set your token, initial capital, moving average period, and time horizon to see how Nova models momentum-based trading.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-200 sm:gap-2 sm:text-sm">
          Token
          <TokenSelector
            value={formState.token}
            onSelect={(nextValue, asset?: CoindeskAsset) => {
              handleFieldChangeBuilder("token")(nextValue);
              if (asset) {
                handleFieldChangeBuilder("tokenName")(asset.name ?? nextValue);
                handleFieldChangeBuilder("market")(
                  asset.market ?? formState.market ?? DEFAULT_MARKET,
                );
              }
            }}
            placeholder="e.g. BTC"
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-200 sm:gap-2 sm:text-sm">
          Initial capital (USD)
          <input
            type="number"
            min="1000"
            step="1000"
            value={formState.initialCapital}
            onChange={handleFieldChange("initialCapital")}
            className="rounded-xl border border-ocean/60 bg-surface/90 px-3 py-1.5 text-sm text-slate-50 placeholder:text-slate-500 shadow-inner focus:border-mint focus:bg-surface/95 focus:outline-none focus:ring-1 focus:ring-mint/35 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-base"
            placeholder="e.g. 10000"
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-200 sm:gap-2 sm:text-sm">
          Moving average period
          <select
            value={formState.maPeriod}
            onChange={handleFieldChange("maPeriod")}
            className="rounded-xl border border-ocean/60 bg-surface/90 px-3 py-1.5 text-sm text-slate-50 focus:border-mint focus:bg-surface/95 focus:outline-none focus:ring-1 focus:ring-mint/35 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-base"
          >
            <option value="50">50-day MA</option>
            <option value="100">100-day MA</option>
            <option value="200">200-day MA</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-200 sm:gap-2 sm:text-sm">
          Duration
          <select
            value={formState.duration}
            onChange={handleFieldChange("duration")}
            className="rounded-xl border border-ocean/60 bg-surface/90 px-3 py-1.5 text-sm text-slate-50 focus:border-mint focus:bg-surface/95 focus:outline-none focus:ring-1 focus:ring-mint/35 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-base"
          >
            <option value="6 months">6 months</option>
            <option value="1 year">1 year</option>
            <option value="2 years">2 years</option>
            <option value="3 years">3 years</option>
          </select>
        </label>
      </div>
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-cta-gradient px-4 py-2.5 text-xs font-semibold text-slate-50 shadow-lg shadow-[rgba(58,198,255,0.24)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint sm:px-5 sm:py-3 sm:text-sm"
        disabled={isLoading}
      >
        {isLoading ? "Generating projection..." : "Run trend-following projection"}
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M5 3l6 5-6 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {error ? <p className="text-sm text-critical">{error}</p> : null}
    </form>
  );
}

export const trendFollowingCalculatorDefinition: CalculatorDefinition<TrendFollowingFormState> = {
  id: "trend-following",
  label: "Trend-Following",
  description: "Trade on momentum: go long when price exceeds moving average, hold stablecoin otherwise.",
  Form: TrendFollowingCalculatorForm,
  getInitialState: () => ({ ...defaultFormState }),
  getRequestConfig: async (formState) => {
    if (!formState.token?.trim()) {
      throw new Error("Select a token before running the trend-following projection.");
    }

    const durationDays = resolveDurationDays(formState.duration, DURATION_TO_DAYS, DEFAULT_DURATION_DAYS);
    const clock = getCurrentUtcClockInfo();
    const history = await fetchCoindeskHistoryWithSummary({
      symbol: formState.token,
      market: formState.market,
      durationDays,
    });
    const capitalInput = Number.parseFloat(formState.initialCapital);
    const initialCapitalUsd = Number.isFinite(capitalInput) && capitalInput > 0 ? capitalInput : 0;
    const maInput = Number.parseInt(formState.maPeriod, 10);
    const normalizedMaPeriod = Number.isFinite(maInput) && maInput > 0 ? maInput : 50;
    const shortWindow = Math.max(5, Math.round(normalizedMaPeriod / 2));
    const longWindow = Math.max(shortWindow + 1, normalizedMaPeriod);
    const projectionWindowDays = durationDays;

    const projection = simulateTrendFollowing(history, {
      initialCapitalUsd,
      shortWindow,
      longWindow,
      projectionWindowDays,
    });

    const prompt = buildPrompt(formState, history, clock, {
      historyHighlights: projection.history,
      projectionSeries: projection.projection,
      strategyMetrics: projection.metrics,
      initialCapitalUsd,
      shortWindow,
      longWindow,
      projectionWindowDays,
    });

    return buildNovaRequestOptions(prompt, { max_tokens: 9000 });
  },
  parseReply: parseNovaReply,
  getSeriesLabel: (formState) => `${formState.token} price`,
  initialSummary: initialSummaryMessage,
  pendingSummary: pendingSummaryMessage,
};
