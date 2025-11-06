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
import { parseTrendFollowingReply } from "./parser";

export type TrendFollowingFormState = {
  token: string;
  initialCapital: string;
  maPeriod: string;
  duration: string;
};

const defaultFormState: TrendFollowingFormState = {
  token: "BTC",
  initialCapital: "10000",
  maPeriod: "50",
  duration: "1 year",
};

const initialSummaryMessage = "Run the projection to see Nova's analysis of this trend-following strategy.";
const pendingSummaryMessage = "Generating Nova's latest projection...";

function buildPrompt({ token, initialCapital, maPeriod, duration }: TrendFollowingFormState) {
  return joinPromptLines([
    `Using your coindesk tool, model the following trend-following strategy.`,
    `Respond in a single message, DO NOT request clarification, and DO NOT ask any follow-up questions.`,
    `Strategy: Start with ${initialCapital} USD. Buy ${token} when price > ${maPeriod}-day MA, hold stablecoin when price <= ${maPeriod}-day MA. Project over ${duration}.`,
    "",
    "Guidelines:",
    "1. Determine the schedule start date automatically: call your date/time capability to retrieve today's UTC date and use it as the starting point. Do not ask the user.",
    `2. Generate a synthetic price path for ${token} covering ${duration}. When real history improves realism, use the available data tools silently; otherwise craft a consistent synthetic series with volatility. Include the ${maPeriod}-day moving average at each point.`,
    `3. Simulate the strategy: track when you'd be in ${token} (price > MA) vs. stablecoin (price <= MA), calculate portfolio value and a HODL baseline at each date.`,
    `4. Estimate performance: approximate Sharpe ratio and maximum drawdown for both strategy and HODL. Note any key trades and risk factors.`,
    "5. Produce a structured summary using the JSON schema below. Focus on three concise sections that capture performance metrics, trade cadence, and risks. Keep assumptions explicit inside the sections.",
    `6. Provide a modeled series with one entry per trading day across ${duration}. Each point must include price, moving average, portfolio equity, and HODL baseline values. All values must be numbers.`,
    "7. Never ask questions, never defer, and respond with a single JSON object—no prose or markdown framing.",
    "",
    "Return JSON only, shaped exactly like:",
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
    '      "assumptions": ["State the key modeling assumptions clearly."]',
    "    },",
    '    "sections": [',
    "      {",
    '        "type": "performance",',
    '        "headline": "Performance snapshot",',
    '        "summary": "Highlight Sharpe ratio, drawdown, and total return for strategy vs. HODL.",',
    '        "metrics": [',
    '          { "label": "Strategy total return (%)", "value": 12.5 },',
    '          { "label": "Strategy Sharpe", "value": 0.92 },',
    '          { "label": "Strategy max drawdown (%)", "value": -18.4 }',
    "        ]",
    "      },",
    "      {",
    '        "type": "trade_flow",',
    '        "headline": "Trade cadence & positioning",',
    '        "summary": "Explain how often price crosses the moving average and resulting position changes.",',
    '        "metrics": [',
    '          { "label": "Time in market (%)", "value": 64 },',
    '          { "label": "Major crossover count", "value": 14 }',
    "        ]",
    "      },",
    "      {",
    '        "type": "risk",',
    '        "headline": "Risks to monitor",',
    '        "summary": "Outline sensitivity to volatility regimes, whipsaws, or liquidity constraints.",',
    '        "risks": ["List each material risk in plain language."]',
    "      }",
    "    ],",
    '    "notes": ["Optional reminders or next steps if they help interpret the model."]',
    "  },",
    '  "series": [',
    "    {",
    '      "id": "trend_price_equity",',
    '      "label": "Modeled price & equity",',
    '      "points": [',
    '        { "date": "YYYY-MM-DD", "price": 123.45, "ma": 120.01, "portfolioEquity": 10050.25, "hodlValue": 9950.75 }',
    "      ]",
    "    }",
    "  ]",
    "}",
    "",
    "Populate metric values with actual calculations; replace template numbers before responding. Do not emit trailing commentary.",
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
          <input
            type="text"
            value={formState.token}
            onChange={handleFieldChange("token")}
            className="rounded-xl border border-ocean/60 bg-surface/90 px-3 py-1.5 text-sm text-slate-50 placeholder:text-slate-500 shadow-inner focus:border-mint focus:bg-surface/95 focus:outline-none focus:ring-1 focus:ring-mint/35 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-base"
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
  getRequestConfig: (formState) => {
    const prompt = buildPrompt(formState);

    return buildNovaRequestOptions(prompt, { max_tokens: 18000 });
  },
  parseReply: parseNovaReply,
  getSeriesLabel: (formState) => `${formState.token} price`,
  initialSummary: initialSummaryMessage,
  pendingSummary: pendingSummaryMessage,
};
