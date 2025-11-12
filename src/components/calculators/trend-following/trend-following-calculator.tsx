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

function buildPrompt(
  { token, tokenName, initialCapital, maPeriod, duration }: TrendFollowingFormState,
  history: CoindeskHistoryResult,
  clock: UtcClockInfo,
) {
  const resolvedTokenName = tokenName?.trim() || token;
  const normalizedCandles = history.candles.map((candle) => ({
    date: candle.date,
    open: Number(candle.open.toFixed(8)),
    high: Number(candle.high.toFixed(8)),
    low: Number(candle.low.toFixed(8)),
    close: Number(candle.close.toFixed(8)),
  }));
  const serializedHistory = JSON.stringify(normalizedCandles, null, 2);

  return joinPromptLines([
    `Using the provided CoinDesk history data, model the following trend-following strategy without calling any external tools.`,
    `Respond in a single message, DO NOT request clarification, and DO NOT ask any follow-up questions.`,
    `Strategy: Start with ${initialCapital} USD. Buy ${token} (${resolvedTokenName}) when price > ${maPeriod}-day MA, hold stablecoin when price <= ${maPeriod}-day MA. Project over ${duration}.`,
    "",
    "Clock context:",
    `- Current UTC date (schedule anchor): ${clock.currentUtcDate}`,
    `- Current UTC date/time: ${clock.currentUtcIso}`,
    "",
    "CoinDesk data context:",
    `- Market: ${history.market}`,
    `- Instrument: ${history.instrument}`,
    `- Date range: ${history.startDate} → ${history.endDate}`,
    "",
    "Historical summary (mirrors get_coindesk_history response):",
    history.summary,
    "",
    "Raw OHLC closes (oldest first):",
    serializedHistory,
    "",
    "Guidelines:",
    "1. Use the provided current UTC timestamp exactly as the modeling anchor. Do not call any date/time tools.",
    `2. Use the supplied CoinDesk dataset for historical reference and to anchor baseline drift; do NOT invoke CoinDesk, pricing, or time tools.`,
    `3. Generate a synthetic-but-coherent price path for ${token} covering ${duration}, biasing toward the provided data when it improves realism. Include the ${maPeriod}-day moving average at each point.`,
    `4. Simulate the strategy: track when you'd be in ${token} (price > MA) vs. stablecoin (price <= MA), calculate portfolio value and a HODL baseline at each date.`,
    `5. Estimate performance: approximate Sharpe ratio and maximum drawdown for both strategy and HODL. Note any key trades and risk factors.`,
    "6. Produce a structured summary using the JSON schema below. Focus on three concise sections that capture performance metrics, trade cadence, and risks. Keep assumptions explicit inside the sections.",
    "7. Limit the modeled price/MA/portfolio series to at most 120 evenly spaced points (roughly weekly). Each point must include date, price, moving average, portfolioEquity, and hodlValue numbers.",
    "8. Never ask questions, never defer, and respond with a single JSON object—no prose or markdown framing.",
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

    const prompt = buildPrompt(formState, history, clock);

    return buildNovaRequestOptions(prompt, { max_tokens: 18000 });
  },
  parseReply: parseNovaReply,
  getSeriesLabel: (formState) => `${formState.token} price`,
  initialSummary: initialSummaryMessage,
  pendingSummary: pendingSummaryMessage,
};
