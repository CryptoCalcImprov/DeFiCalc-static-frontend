"use client";

import type { ChangeEvent } from "react";

import type { CalculatorDefinition, CalculatorFormProps, CalculatorResult } from "@/components/calculators/types";
import { buildFieldChangeHandler } from "@/components/calculators/utils/forms";
import { joinPromptLines } from "@/components/calculators/utils/prompt";
import { parseCalculatorReply } from "@/components/calculators/utils/summary";
import { buildNovaRequestOptions } from "@/components/calculators/utils/request";
import { TokenSelector } from "@/components/calculators/workspace/TokenSelector";

export type TrendFollowingFormState = {
  token: string;
  tokenId?: string;
  initialCapital: string;
  maPeriod: string;
  duration: string;
};

const defaultFormState: TrendFollowingFormState = {
  token: "BTC",
  tokenId: "bitcoin",
  initialCapital: "10000",
  maPeriod: "50",
  duration: "1 year",
};

const initialSummaryMessage = "Run the projection to see Nova's analysis of this trend-following strategy.";
const pendingSummaryMessage = "Generating Nova's latest projection...";

function buildPrompt(formState: TrendFollowingFormState, forecastParams?: Record<string, unknown>) {
  const { token, initialCapital, maPeriod, duration } = formState;
  const normalizedToken = token.trim() || "the selected asset";
  const forecastParamsPayload = forecastParams ? JSON.stringify(forecastParams) : "{}";

  return joinPromptLines([
    "IMPORTANT: Call ONLY the `get_forecast` MCP tool. Do NOT call any other tools.",
    "The `get_forecast` tool returns BOTH historical data AND projections - you do NOT need `get_coindesk_history`.",
    "Do NOT call: get_coindesk_history, calculate_expression, or any other tool.",
    "",
    "Call get_forecast with FORECAST_PARAMS and rely on chart.history and chart.projection (mean, percentile_10, percentile_90).",
    "Compute all metrics directly from the projection; do not invoke any calculation tools.",
    "Use those prices to explain how the strategy would trade. Do not synthesize new price series.",
    "",
    "CRITICAL: You must include the COMPLETE chart data from the get_forecast response:",
    "- Include ALL data points from chart.history (the full OHLC time series)",
    "- Include ALL data points from chart.projection (the full forecast time series)",
    "- Do NOT summarize, truncate, or reduce the arrays to just start/end values",
    "- Each projection point must have timestamp, mean, percentile_10, and percentile_90",
    "- The projection array should contain every forecasted data point, not linear interpolations",
    "",
    `Strategy: start with ${initialCapital} USD. Go long ${normalizedToken} when price exceeds the ${maPeriod}-day moving average; otherwise hold stablecoin. Project across ${duration}.`,
    "",
    "Provide analysis and insights about this trend-following strategy. DO NOT calculate specific buy/sell points - the frontend will detect MA crossovers on the sample path.",
    "Return JSON only. Use the schema below with `insight` and `chart` sections.",
    "",
    "FORECAST_PARAMS:",
    forecastParamsPayload,
    "",
    "Base your reasoning on the forecast output and compute metrics directly from those prices.",
    "",
    "Response schema:",
    "{",
    '  "insight": {',
    '    "calculator": {',
    '      "id": "trend-following",',
    '      "label": "Trend-Following",',
    '      "category": "momentum_strategy",',
    '      "version": "v2"',
    "    },",
    '    "context": {',
    '      "as_of": "YYYY-MM-DD",',
    `      "asset": "${token}",`,
    '      "inputs": {',
    `        "initial_capital_usd": ${initialCapital},`,
    `        "moving_average_period": ${maPeriod},`,
    `        "duration": "${duration}"`,
    "      },",
    '      "assumptions": ["State the key modeling assumptions clearly."]',
    "    },",
    '    "sections": [',
    "      {",
    '        "type": "performance",',
    '        "headline": "Expected volatility & trend strength",',
    '        "summary": "Discuss the forecast volatility and potential for trending moves based on percentile bands.",',
    '        "metrics": [',
    '          { "label": "Forecast volatility", "value": "High/Medium/Low" },',
    '          { "label": "Mean price change (%)", "value": 12.5 }',
    "        ]",
    "      },",
    "      {",
    '        "type": "trade_flow",',
    '        "headline": "Crossover frequency expectations",',
    '        "summary": "Discuss expected crossover frequency based on historical volatility and the selected MA period.",',
    '        "metrics": [',
    '          { "label": "Historical volatility", "value": "X%" }',
    "        ]",
    "      },",
    "      {",
    '        "type": "risk",',
    '        "headline": "Risks to monitor",',
    '        "summary": "Discuss whipsaw risk, false signals, and market conditions that invalidate MA strategies.",',
    '        "risks": ["Whipsaw risk in sideways markets", "False signals during high volatility", "Lagging indicator may miss rapid reversals"]',
    "      }",
    "    ],",
    '    "notes": ["Optional reminders or next steps if they help interpret the model."]',
    "  },",
    '  "chart": {',
    '    "history": [',
    "      // Include ALL OHLC candles from the MCP tool response",
    '      { "timestamp": "YYYY-MM-DDTHH:MM:SSZ", "open": 0, "high": 0, "low": 0, "close": 0 }',
    "    ],",
    '    "projection": [',
    "      // Include EVERY forecast data point from the MCP tool - do NOT reduce to start/end only",
    '      { "timestamp": "YYYY-MM-DDTHH:MM:SSZ", "mean": 0, "percentile_10": 0, "percentile_90": 0 }',
    "    ]",
    "  }",
    "}",
    "",
    "Populate metric values with actual calculations; replace template numbers and do not emit trailing commentary.",
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
            onSelect={(nextValue, asset) => {
              handleFieldChangeBuilder("token")(nextValue);
              handleFieldChangeBuilder("tokenId")(asset?.slug);
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
  getRequestConfig: (formState, _chartProjection, extras) => {
    const forecastParams = extras?.forecastParams as Record<string, unknown> | undefined;
    const prompt = buildPrompt(formState, forecastParams);

    return buildNovaRequestOptions(prompt, {
      max_tokens: 50000,
      ...(forecastParams ? { bodyExtras: { forecast_params: forecastParams } } : {}),
    });
  },
  parseReply: parseNovaReply,
  getSeriesLabel: (formState) => `${formState.token} price`,
  initialSummary: initialSummaryMessage,
  pendingSummary: pendingSummaryMessage,
};
