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
import {
  simulateBuyTheDip,
  type BuyTheDipAnalysisPackage,
} from "@/components/calculators/utils/modeling";

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
const LOOKBACK_WINDOW_MIN_DAYS = 7;
const LOOKBACK_WINDOW_MAX_DAYS = 60;
const DEFAULT_DIP_THRESHOLD_PERCENT = 10;
const DIP_THRESHOLD_MIN_PERCENT = 1;
const DIP_THRESHOLD_MAX_PERCENT = 60;

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

type BuyTheDipModelingArtifacts = {
  historyHighlights: BuyTheDipAnalysisPackage["history"];
  projectionSeries: BuyTheDipAnalysisPackage["projection"];
  strategyMetrics: BuyTheDipAnalysisPackage["metrics"];
  totalBudgetUsd: number;
  dipThresholdPercent: number;
  lookbackWindowDays: number;
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

function formatPercent(value: number) {
  return formatNumber(value * 100);
}

function sampleTriggers(triggers: BuyTheDipAnalysisPackage["projection"]["triggers"], target = 12) {
  if (triggers.length <= target) {
    return triggers;
  }
  return triggers.slice(-target);
}

function sampleWindows(windows: BuyTheDipAnalysisPackage["projection"]["projectedWindows"], target = 6) {
  if (windows.length <= target) {
    return windows;
  }
  return windows.slice(0, target);
}

function buildPrompt(
  { token, tokenName, budget, dipThreshold, duration }: BuyTheDipFormState,
  history: CoindeskHistoryResult,
  clock: UtcClockInfo,
  modeling: BuyTheDipModelingArtifacts,
) {
  const resolvedTokenName = tokenName?.trim() || token;
  const {
    historyHighlights,
    projectionSeries,
    strategyMetrics,
    totalBudgetUsd,
    dipThresholdPercent,
    lookbackWindowDays,
    projectionWindowDays,
  } = modeling;

  const analysisPackage = {
    context: {
      calculator: {
        id: "buy-the-dip",
        label: "Buy the Dip",
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
        budget_usd: formatNumber(totalBudgetUsd),
        dip_threshold_percent: formatNumber(dipThresholdPercent),
        dip_threshold_fraction: formatNumber(dipThresholdPercent / 100),
        duration,
        duration_days: projectionWindowDays,
        lookback_window_days: lookbackWindowDays,
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
      remaining_budget_usd: formatNumber(projectionSeries.remainingBudget),
      triggers_sample: sampleTriggers(projectionSeries.triggers).map((trigger) => ({
        date: trigger.date,
        drawdown_percent: formatPercent(trigger.drawdown),
        price: formatNumber(trigger.price),
      })),
      projected_windows: sampleWindows(projectionSeries.projectedWindows).map((window) => ({
        window_start: window.windowStart,
        window_end: window.windowEnd,
        allocation_usd: formatNumber(window.allocation),
        expected_price: formatNumber(window.expectedPrice),
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
    "You are Nova, a quant researcher evaluating a buy-the-dip deployment.",
    "Rely solely on the provided data. Do not call external tools, request clarification, or defer your answer.",
    "",
    `analysisPackage = ${analysisJson}`,
    "",
    "Use analysisPackage to produce an insight-driven response:",
    "1. Summarize the dip opportunity set and deployment cadence referencing triggers_sample, projected_windows, and metrics.",
    "2. Stress-test assumptions about drawdown frequency, liquidity, and budget usage; capture takeaways inside assumptions arrays.",
    "3. Highlight key risks, monitoring cues, and residual dry powder using remaining_budget_usd and history stats.",
    "",
    "Response constraints:",
    "- Return a single JSON object following the schema below.",
    "- Populate every numeric field with explicit numbers.",
    "- Do not include commentary outside the JSON payload.",
    "",
    "Schema:",
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
    '      "analysis_reference": ["projection.triggers_sample", "projection.remaining_budget_usd"],',
    '      "assumptions": ["Summarize core modeling choices and stress-test insights."]',
    "    },",
    '    "sections": [',
    "      {",
    '        "type": "deployment_plan",',
    '        "headline": "Budget deployment outlook",',
    '        "summary": "Explain how capital stages into the market across projected dip windows.",',
    '        "metrics": [',
    '          { "label": "Total budget (USD)", "value": 5000 },',
    '          { "label": "Budget deployed (USD)", "value": 3800 },',
    '          { "label": "Remaining budget (USD)", "value": 1200 }',
    "        ],",
    '        "assumptions": ["Document cooling periods, sizing logic, or trigger sensitivity."],',
    '        "risks": ["Note execution or liquidity risks tied to clustering dips."]',
    "      },",
    "      {",
    '        "type": "performance_driver",',
    '        "headline": "Opportunity drivers & stress test",',
    '        "summary": "Describe what creates the opportunity set and how stress tests shift outcomes.",',
    '        "assumptions": ["Capture the scenario comparisons or sensitivities explored."],',
    '        "risks": ["Highlight any fragility revealed by the stress test."]',
    "      },",
    "      {",
    '        "type": "risk_assumption",',
    '        "headline": "Risk & monitoring",',
    '        "summary": "Outline key risks, warning signs, and contingency actions.",',
    '        "risks": ["List the major risks in plain language."],',
    '        "assumptions": ["Call out mitigations or monitoring steps."]',
    "      }",
    "    ],",
    '    "notes": ["Optional reminders or next steps."]',
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

function resolveLookbackWindowDays(durationDays: number) {
  const approx = Math.round(durationDays / 8);
  const clamped = Math.min(LOOKBACK_WINDOW_MAX_DAYS, Math.max(LOOKBACK_WINDOW_MIN_DAYS, approx));
  return clamped;
}

function normalizeDipThresholdPercent(rawPercent: number) {
  if (!Number.isFinite(rawPercent) || rawPercent <= 0) {
    return DEFAULT_DIP_THRESHOLD_PERCENT;
  }
  const clamped = Math.min(DIP_THRESHOLD_MAX_PERCENT, Math.max(DIP_THRESHOLD_MIN_PERCENT, rawPercent));
  return clamped;
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
    const budgetInput = Number.parseFloat(formState.budget);
    const totalBudgetUsd = Number.isFinite(budgetInput) && budgetInput > 0 ? budgetInput : 0;
    const rawThreshold = Number.parseFloat(formState.dipThreshold);
    const dipThresholdPercent = normalizeDipThresholdPercent(rawThreshold);
    const lookbackWindowDays = resolveLookbackWindowDays(durationDays);
    const projectionWindowDays = durationDays;

    const projection = simulateBuyTheDip(history, {
      totalBudgetUsd,
      dipThreshold: dipThresholdPercent / 100,
      lookbackWindowDays,
      projectionWindowDays,
    });

    const prompt = buildPrompt(formState, history, clock, {
      historyHighlights: projection.history,
      projectionSeries: projection.projection,
      strategyMetrics: projection.metrics,
      totalBudgetUsd,
      dipThresholdPercent,
      lookbackWindowDays,
      projectionWindowDays,
    });

    return buildNovaRequestOptions(prompt, { max_tokens: 9000 });
  },
  parseReply: parseNovaReply,
  getSeriesLabel: (formState) => `${formState.token} price`,
  initialSummary: initialSummaryMessage,
  pendingSummary: pendingSummaryMessage,
};
