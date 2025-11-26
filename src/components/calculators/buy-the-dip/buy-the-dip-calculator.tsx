"use client";

import type { ChangeEvent } from "react";

import type { CalculatorDefinition, CalculatorFormProps, CalculatorResult } from "@/components/calculators/types";
import { buildFieldChangeHandler } from "@/components/calculators/utils/forms";
import { joinPromptLines } from "@/components/calculators/utils/prompt";
import { parseCalculatorReply } from "@/components/calculators/utils/summary";
import { buildNovaRequestOptions } from "@/components/calculators/utils/request";
import { TokenSelector } from "@/components/calculators/workspace/TokenSelector";

export type BuyTheDipFormState = {
  token: string;
  tokenId?: string;
  budget: string;
  dipThreshold: string;
  duration: string;
};

const defaultFormState: BuyTheDipFormState = {
  token: "BTC",
  tokenId: "bitcoin",
  budget: "5000",
  dipThreshold: "10",
  duration: "6 months",
};

const initialSummaryMessage = "Run the projection to see Nova's perspective on this strategy.";
const pendingSummaryMessage = "Generating Nova's latest projection...";

function buildPrompt(formState: BuyTheDipFormState, forecastParams?: Record<string, unknown>) {
  const { token, budget, dipThreshold, duration } = formState;
  const normalizedToken = token.trim() || "the selected asset";
  const forecastParamsPayload = forecastParams ? JSON.stringify(forecastParams) : "{}";

  return joinPromptLines([
    "IMPORTANT: Call ONLY the `get_forecast` MCP tool. Do NOT call any other tools.",
    "The `get_forecast` tool returns BOTH historical data AND projections - you do NOT need `get_coindesk_history`.",
    "Do NOT call: get_coindesk_history, calculate_expression, or any other tool.",
    "",
    "Call get_forecast with FORECAST_PARAMS and rely on chart.history and chart.projection (mean, percentile_10, percentile_90).",
    "Perform all math directly from the returned projection; do not invoke any calculation tools.",
    "Do not invent additional prices—anchor annotations to the returned projection.",
    "",
    "CRITICAL: You must include the COMPLETE chart data from the get_forecast response:",
    "- Include ALL data points from chart.history (the full OHLC time series)",
    "- Include ALL data points from chart.projection (the full forecast time series)",
    "- Do NOT summarize, truncate, or reduce the arrays to just start/end values",
    "- Each projection point must have timestamp, mean, percentile_10, and percentile_90",
    "- The projection array should contain every forecasted data point, not linear interpolations",
    "",
    `Strategy: deploy ${budget} USD to buy ${normalizedToken} after ${dipThreshold}%+ drops from recent highs within ${duration}.`,
    "",
    "Provide analysis and insights about this strategy. DO NOT calculate specific buy points - the frontend will detect dips on the sample path.",
    "Return JSON only. Use the schema below with `insight` and `chart` sections.",
    "",
    "FORECAST_PARAMS:",
    forecastParamsPayload,
    "",
    "Response schema:",
    "{",
    '  "insight": {',
    '    "calculator": {',
    '      "id": "buy-the-dip",',
    '      "label": "Buy the Dip",',
    '      "category": "opportunistic_entry",',
    '      "version": "v2"',
    "    },",
    '    "context": {',
    '      "as_of": "YYYY-MM-DD",',
    `      "asset": "${token}",`,
    '      "inputs": {',
    `        "budget_usd": ${budget},`,
    `        "dip_threshold_percent": ${dipThreshold},`,
    `        "duration": "${duration}"`,
    "      },",
    '      "assumptions": ["Capture major modeling assumptions here."]',
    "    },",
    '    "sections": [',
    "      {",
    '        "type": "deployment_plan",',
    '        "headline": "Strategy overview",',
    '        "summary": "Describe the buy-the-dip approach and how it takes advantage of volatility.",',
    '        "metrics": [',
    '          { "label": "Total budget (USD)", "value": 5000 },',
    '          { "label": "Dip threshold", "value": "10%" }',
    "        ],",
    '        "assumptions": ["Note assumptions about execution, timing, etc."]',
    "      },",
    "      {",
    '        "type": "performance_driver",',
    '        "headline": "Price dynamics & opportunity",',
    '        "summary": "Discuss the forecast volatility and potential dip scenarios based on the percentile bands.",',
    '        "risks": ["Note slippage, liquidity, or volatility risks."]',
    "      },",
    "      {",
    '        "type": "risk_assumption",',
    '        "headline": "Key risks & monitoring",',
    '        "summary": "Highlight conditions that could invalidate the strategy.",',
    '        "risks": ["List each risk plainly."]',
    "      }",
    "    ],",
    '    "notes": ["Optional closing reminders or next steps."]',
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
    "Follow the schema exactly and do not emit markdown or additional prose.",
  ]);
}

function parseNovaReply(reply: string): CalculatorResult {
  return parseCalculatorReply(reply);
}

export function BuyTheDipCalculatorForm({
  formState,
  onFormStateChange,
  onSubmit,
  isLoading,
  error,
}: CalculatorFormProps<BuyTheDipFormState>) {
  const handleFieldChangeBuilder = buildFieldChangeHandler<BuyTheDipFormState>(onFormStateChange);

  const handleFieldChange =
    (field: keyof BuyTheDipFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      handleFieldChangeBuilder(field)(event.target.value);
    };

  return (
    <form
      className="card-surface flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-slate-950/75 via-slate-950/55 to-slate-900/30 p-4 sm:gap-5 sm:rounded-3xl sm:p-6"
      onSubmit={onSubmit}
    >
      <div>
        <h3 className="text-lg font-semibold text-slate-50 sm:text-xl">Configure your buy-the-dip strategy</h3>
        <p className="mt-1.5 text-xs text-muted sm:mt-2 sm:text-sm">
          Set your token, total budget, dip threshold, and time horizon to see how Nova models opportunistic buying.
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
          Total budget (USD)
          <input
            type="number"
            min="100"
            step="100"
            value={formState.budget}
            onChange={handleFieldChange("budget")}
            className="rounded-xl border border-ocean/60 bg-surface/90 px-3 py-1.5 text-sm text-slate-50 placeholder:text-slate-500 shadow-inner focus:border-mint focus:bg-surface/95 focus:outline-none focus:ring-1 focus:ring-mint/35 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-base"
            placeholder="e.g. 5000"
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-200 sm:gap-2 sm:text-sm">
          Dip threshold (%)
          <select
            value={formState.dipThreshold}
            onChange={handleFieldChange("dipThreshold")}
            className="rounded-xl border border-ocean/60 bg-surface/90 px-3 py-1.5 text-sm text-slate-50 focus:border-mint focus:bg-surface/95 focus:outline-none focus:ring-1 focus:ring-mint/35 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-base"
          >
            <option value="5">5% drop</option>
            <option value="10">10% drop</option>
            <option value="15">15% drop</option>
            <option value="20">20% drop</option>
            <option value="25">25% drop</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-200 sm:gap-2 sm:text-sm">
          Duration
          <select
            value={formState.duration}
            onChange={handleFieldChange("duration")}
            className="rounded-xl border border-ocean/60 bg-surface/90 px-3 py-1.5 text-sm text-slate-50 focus:border-mint focus:bg-surface/95 focus:outline-none focus:ring-1 focus:ring-mint/35 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-base"
          >
            <option value="3 months">3 months</option>
            <option value="6 months">6 months</option>
            <option value="1 year">1 year</option>
            <option value="2 years">2 years</option>
          </select>
        </label>
      </div>
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-cta-gradient px-4 py-2.5 text-xs font-semibold text-slate-50 shadow-lg shadow-[rgba(58,198,255,0.24)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint sm:px-5 sm:py-3 sm:text-sm"
        disabled={isLoading}
      >
        {isLoading ? "Generating projection..." : "Run buy-the-dip projection"}
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M5 3l6 5-6 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {error ? <p className="text-sm text-critical">{error}</p> : null}
    </form>
  );
}

export const buyTheDipCalculatorDefinition: CalculatorDefinition<BuyTheDipFormState> = {
  id: "buy-the-dip",
  label: "Buy the Dip",
  description: "Deploy capital strategically when prices fall below threshold levels.",
  Form: BuyTheDipCalculatorForm,
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
