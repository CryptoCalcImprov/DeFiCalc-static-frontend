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
import { resolveDurationDays } from "@/components/calculators/utils/duration";
import {
  getCurrentUtcClockInfo,
  type UtcClockInfo,
} from "@/components/calculators/utils/clock";
import type { CoindeskAsset } from "@/hooks/useCoindeskAssetSearch";
import {
  fetchCoindeskHistoryWithSummary,
  type CoindeskHistoryResult,
} from "@/lib/coindesk-history";

export type BuyTheDipFormState = {
  token: string;
  tokenName: string;
  market: string;
  budget: string;
  dipThreshold: string;
  duration: string;
};

const DEFAULT_MARKET = "cadli";
const DEFAULT_TOKEN_NAME = "Bitcoin";
const DURATION_TO_DAYS: Record<string, number> = {
  "3 months": 90,
  "6 months": 180,
  "1 year": 365,
  "2 years": 730,
};
const DEFAULT_DURATION_DAYS = DURATION_TO_DAYS["6 months"];

const defaultFormState: BuyTheDipFormState = {
  token: "BTC",
  tokenName: DEFAULT_TOKEN_NAME,
  market: DEFAULT_MARKET,
  budget: "5000",
  dipThreshold: "10",
  duration: "6 months",
};

const initialSummaryMessage = "Run the projection to see Nova's perspective on this strategy.";
const pendingSummaryMessage = "Generating Nova's latest projection...";

function buildPrompt(
  { token, tokenName, budget, dipThreshold, duration }: BuyTheDipFormState,
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
    `Using the provided CoinDesk history data, evaluate the following buy-the-dip strategy without calling any external tools.`,
    `Respond in a single message, DO NOT request clarification, and DO NOT ask any follow-up questions.`,
    `Strategy details: deploy a ${budget} USD budget to buy ${token} (${resolvedTokenName}) only when price drops ${dipThreshold}% or more from recent highs, over ${duration}.`,
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
    "1. Use the provided current UTC timestamp as the official start date reference. Do not call any date/time tools.",
    "2. Use the supplied CoinDesk dataset for historical reference and trend context. Do NOT call CoinDesk, pricing, or time tools.",
    "3. Generate a plausible synthetic price path that matches the duration and includes realistic dip opportunities informed by the provided data when helpful.",
    "4. Identify dip opportunities: when price falls by the threshold percentage or more from a recent high (e.g., 7-day or 30-day high), simulate a purchase. Track remaining budget and show when funds would be deployed.",
    "5. Summarize performance factors, deployment pacing, and residual risks using the structured schema below. Keep each section summary to at most two sentences (~220 characters) and avoid enumerating every individual buy. Focus on aggregate stats.",
    "   - Do not include per-trade logs or date-by-date breakdowns inside summaries, metrics, assumptions, or risks.",
    "6. Limit metrics arrays to at most three entries each, highlight totals/averages only, and keep assumptions/risk lists to at most three concise bullets.",
    "7. Provide one entry per trading day or per event date in the modeled price path. Dates must be chronological in YYYY-MM-DD format. Prices must be numeric.",
    "8. Never ask questions, never defer the calculation, and respond with a single JSON object—no prose or markdown framing.",
    "Populate metric values with actual calculations; replace illustrative numbers shown in the template.",
    "",
    "Return JSON only, shaped exactly like:",
    "{",
    '  "insight": {',
    '    "calculator": {',
    '      "id": "buy-the-dip",',
    '      "label": "Buy the Dip",',
    '      "category": "opportunistic_entry",',
    '      "version": "v1"',
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
    '        "headline": "How the budget deploys",',
    '        "summary": "Outline cadence of purchases triggered by dip conditions.",',
    '        "metrics": [',
    '          { "label": "Total budget (USD)", "value": 5000 },',
    '          { "label": "Budget deployed (USD)", "value": 3800 },',
    '          { "label": "Purchases triggered", "value": 7 }',
    "        ],",
    '        "assumptions": ["Clarify rebound thresholds, cooling periods, etc."]',
    "      },",
    "      {",
    '        "type": "performance_driver",',
    '        "headline": "Price dynamics & opportunity set",',
    '        "summary": "Explain the path of highs, dips, and modeled execution prices.",',
    '        "risks": ["Note slippage, liquidity, or volatility risks."]',
    "      },",
    "      {",
    '        "type": "risk_assumption",',
    '        "headline": "Key risks & monitoring",',
    '        "summary": "Highlight conditions that could break the plan.",',
    '        "risks": ["List each risk plainly."]',
    "      }",
    "    ],",
    '    "notes": ["Optional closing reminders or next steps."]',
    "  },",
    '  "series": [',
    "    {",
    '      "id": "price_path",',
    '      "label": "Modeled price path",',
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
  getRequestConfig: async (formState) => {
    if (!formState.token?.trim()) {
      throw new Error("Select a token before running the buy-the-dip projection.");
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
