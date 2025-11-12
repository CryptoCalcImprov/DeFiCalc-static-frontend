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

export type DcaFormState = {
  token: string;
  tokenName: string;
  market: string;
  amount: string;
  interval: string;
  duration: string;
};

const DEFAULT_MARKET = "cadli";
const DEFAULT_TOKEN_NAME = "Ethereum";
const DURATION_TO_DAYS: Record<string, number> = {
  "3 months": 90,
  "6 months": 180,
  "1 year": 365,
  "2 years": 730,
};
const DEFAULT_DURATION_DAYS = DURATION_TO_DAYS["6 months"];

const defaultFormState: DcaFormState = {
  token: "ETH",
  tokenName: DEFAULT_TOKEN_NAME,
  market: DEFAULT_MARKET,
  amount: "500",
  interval: "bi-weekly",
  duration: "6 months",
};

const initialSummaryMessage = "Run the projection to see Nova's perspective on this plan.";
const pendingSummaryMessage = "Generating Nova's latest projection...";

function buildPrompt(
  { token, tokenName, amount, interval, duration }: DcaFormState,
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
    `Using the provided CoinDesk history data, evaluate the following dollar-cost-averaging plan without calling any external tools.`,
    `Respond in a single message, DO NOT request clarification, and DO NOT ask any follow-up questions.`,
    `Plan details: invest ${amount} USD of ${token} (${resolvedTokenName}) on a ${interval} cadence for ${duration}.`,
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
    "1. Use the provided current UTC date/time exactly as the schedule anchor. Do not call any date/time tools.",
    "2. Use the supplied CoinDesk dataset for all historical reference. Do NOT call CoinDesk, pricing, or time tools.",
    "3. Generate a plausible synthetic price path that matches the cadence and duration. When real history improves realism, bias the model toward the supplied data; otherwise craft a consistent synthetic series.",
    "4. Summarize performance drivers, expected cost basis shifts, and risks using the structured schema below. Keep assumptions explicit.",
    "5. Provide one entry per scheduled purchase date in a modeled price path. Dates must be chronological and use YYYY-MM-DD. Prices must be numbers.",
    "6. Never ask questions, never defer the calculation, and respond with a single JSON object—no prose or markdown framing.",
    "Populate metric values with actual calculations; replace illustrative numbers shown in the template.",
    "",
    "Return JSON only, shaped exactly like:",
    "{",
    '  "insight": {',
    '    "calculator": {',
    '      "id": "dca",',
    '      "label": "Dollar-Cost Averaging",',
    '      "category": "accumulation",',
    '      "version": "v1"',
    "    },",
    '    "context": {',
    '      "as_of": "YYYY-MM-DD",',
    `      "asset": "${token}",`,
    '      "inputs": {',
    `        "amount_usd": ${amount},`,
    `        "interval": "${interval}",`,
    `        "duration": "${duration}"`,
    "      },",
    '      "assumptions": ["Describe key assumptions explicitly."]',
    "    },",
    '    "sections": [',
    "      {",
    '        "type": "performance_driver",',
    '        "headline": "Concise label for core performance factor",',
    '        "summary": "1-2 sentence explanation of what drives the modeled outcome.",',
    '        "metrics": [',
    '          { "label": "Total USD invested", "value": 1300 },',
    '          { "label": "Estimated cost basis (USD)", "value": 1.91 }',
    "        ],",
    '        "assumptions": ["Note any assumptions specific to this driver."],',
    '        "risks": ["Highlight sensitivities or risk factors."]',
    "      },",
    "      {",
    '        "type": "risk_assumption",',
    '        "headline": "Key risks & sensitivities",',
    '        "summary": "Explain how drift, volatility, or operational constraints could change the result.",',
    '        "risks": ["List each material risk in plain language."]',
    "      }",
    "    ],",
    '    "notes": ["Include optional closing reminders or action items when helpful."]',
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

export function DcaCalculatorForm({
  formState,
  onFormStateChange,
  onSubmit,
  isLoading,
  error,
}: CalculatorFormProps<DcaFormState>) {
  const handleFieldChangeBuilder = buildFieldChangeHandler<DcaFormState>(onFormStateChange);

  const handleFieldChange =
    (field: keyof DcaFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      handleFieldChangeBuilder(field)(event.target.value);
    };

  return (
    <form
      className="card-surface flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-slate-950/75 via-slate-950/55 to-slate-900/30 p-4 sm:gap-5 sm:rounded-3xl sm:p-6"
      onSubmit={onSubmit}
    >
      <div>
        <h3 className="text-lg font-semibold text-slate-50 sm:text-xl">Configure your DCA plan</h3>
        <p className="mt-1.5 text-xs text-muted sm:mt-2 sm:text-sm">
          Adjust token, contribution size, cadence, and horizon to see how Nova models accumulation over time.
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
            placeholder="e.g. ETH"
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-200 sm:gap-2 sm:text-sm">
          Contribution amount (USD)
          <input
            type="number"
            min="10"
            step="10"
            value={formState.amount}
            onChange={handleFieldChange("amount")}
            className="rounded-xl border border-ocean/60 bg-surface/90 px-3 py-1.5 text-sm text-slate-50 placeholder:text-slate-500 shadow-inner focus:border-mint focus:bg-surface/95 focus:outline-none focus:ring-1 focus:ring-mint/35 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-base"
            placeholder="e.g. 500"
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-200 sm:gap-2 sm:text-sm">
          Purchase cadence
          <select
            value={formState.interval}
            onChange={handleFieldChange("interval")}
            className="rounded-xl border border-ocean/60 bg-surface/90 px-3 py-1.5 text-sm text-slate-50 focus:border-mint focus:bg-surface/95 focus:outline-none focus:ring-1 focus:ring-mint/35 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-base"
          >
            <option value="weekly">Weekly</option>
            <option value="bi-weekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
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
        {isLoading ? "Generating projection..." : "Run DCA projection"}
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M5 3l6 5-6 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {error ? <p className="text-sm text-critical">{error}</p> : null}
    </form>
  );
}

export const dcaCalculatorDefinition: CalculatorDefinition<DcaFormState> = {
  id: "dca",
  label: "DCA",
  description: "Automate recurring buys to average into a token over time.",
  Form: DcaCalculatorForm,
  getInitialState: () => ({ ...defaultFormState }),
  getRequestConfig: async (formState) => {
    if (!formState.token?.trim()) {
      throw new Error("Select a token before running the DCA projection.");
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
