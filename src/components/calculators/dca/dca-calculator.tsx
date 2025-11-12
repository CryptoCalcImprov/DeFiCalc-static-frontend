"use client";

import type { ChangeEvent } from "react";

import type {
  CalculatorDefinition,
  CalculatorDeterministicSummary,
  CalculatorFormProps,
  CalculatorPreparedAnalysis,
  CalculatorResult,
  CalculatorSummaryMetric,
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
  simulateDcaProjection,
  type DcaAnalysisPackage,
} from "@/components/calculators/utils/modeling";

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
const INTERVAL_TO_DAYS: Record<string, number> = {
  weekly: 7,
  "bi-weekly": 14,
  monthly: 30,
};
const DEFAULT_INTERVAL_DAYS = INTERVAL_TO_DAYS["bi-weekly"];

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

type DcaModelingArtifacts = {
  historyHighlights: DcaAnalysisPackage["history"];
  projectionSeries: DcaAnalysisPackage["projection"];
  strategyMetrics: DcaAnalysisPackage["metrics"];
  contributionUsd: number;
  intervalDays: number;
  durationDays: number;
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

function sampleScheduleEntries(schedule: DcaAnalysisPackage["projection"]["schedule"], target = 24) {
  if (schedule.length <= target) {
    return schedule;
  }
  const step = Math.ceil(schedule.length / target);
  const sampled = schedule.filter((_, index) => index % step === 0);
  if (sampled[sampled.length - 1]?.date !== schedule[schedule.length - 1]?.date) {
    sampled[sampled.length - 1] = schedule[schedule.length - 1];
  }
  return sampled.slice(0, target);
}

type DcaPromptAnalysisPackage = ReturnType<typeof createAnalysisPackage>;

function createAnalysisPackage(
  { token, tokenName, amount, interval, duration }: DcaFormState,
  history: CoindeskHistoryResult,
  clock: UtcClockInfo,
  modeling: DcaModelingArtifacts,
) {
  const resolvedTokenName = tokenName?.trim() || token;
  const {
    historyHighlights,
    projectionSeries,
    strategyMetrics,
    contributionUsd,
    intervalDays,
    durationDays,
  } = modeling;

  return {
    context: {
      calculator: {
        id: "dca",
        label: "Dollar-Cost Averaging",
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
        amount_usd: formatNumber(contributionUsd),
        interval,
        interval_days: intervalDays,
        duration,
        duration_days: durationDays,
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
      totals: {
        total_contribution_usd: formatNumber(projectionSeries.totalContribution),
        projected_units: formatNumber(projectionSeries.projectedHoldings),
        projected_value_usd: formatNumber(projectionSeries.projectedValue),
      },
      schedule_samples: sampleScheduleEntries(projectionSeries.schedule).map((entry) => ({
        date: entry.date,
        price: formatNumber(entry.price),
        contribution: formatNumber(entry.contribution),
        cumulative_units: formatNumber(entry.cumulativeUnits),
        cumulative_cost: formatNumber(entry.cumulativeCost),
        cost_basis: formatNumber(entry.costBasis),
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
}

function buildPrompt(formState: DcaFormState, analysisPackage: DcaPromptAnalysisPackage) {
  const { token, amount, interval, duration } = formState;
  const analysisJson = JSON.stringify(analysisPackage, null, 2);

  return joinPromptLines([
    "You are Nova, a quant researcher analyzing a crypto dollar-cost-averaging plan.",
    "Stay within the provided data. Do not call external tools, request clarifications, or defer your answer.",
    "",
    `analysisPackage = ${analysisJson}`,
    "",
    "Use analysisPackage to craft insight-focused output:",
    "1. Summarize plan context and modeled outcomes in two or three crisp sentences referencing metrics and projection totals.",
    "2. Stress-test the assumptions behind cadence, drift, and volatility; surface the sensitivities inside assumptions arrays.",
    "3. Highlight operational and market risks, grounding each point in the provided history and projection data.",
    "",
    "Response constraints:",
    "- Return a single JSON object that follows the schema below.",
    "- Populate every numeric field with numbers (no placeholders).",
    "- Do not include commentary outside the JSON payload.",
    "",
    "Schema:",
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
    '      "analysis_reference": ["metrics.total_contribution_usd", "projection.totals.projected_value_usd"],',
    '      "assumptions": ["Document the key modeling assumptions and stress-test takeaways."]',
    "    },",
    '    "sections": [',
    "      {",
    '        "type": "performance_driver",',
    '        "headline": "Plan performance & signals",',
    '        "summary": "Two-sentence synthesis referencing totals and notable movements.",',
    '        "metrics": [',
    '          { "label": "Total USD invested", "value": 1300 },',
    '          { "label": "Projected value (USD)", "value": 1520 }',
    "        ],",
    '        "assumptions": ["Capture the stress-test insight or scenario comparison."],',
    '        "risks": ["Note hidden sensitivities tied to cadence or volatility."]',
    "      },",
    "      {",
    '        "type": "risk_assumption",',
    '        "headline": "Risk outlook",',
    '        "summary": "Highlight structural, market, and operational risks.",',
    '        "risks": ["List material risks in plain language."],',
    '        "assumptions": ["Mention mitigations or monitoring guidance."]',
    "      }",
    "    ],",
    '    "notes": ["Optional closing reminders or action items."]',
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

function resolveIntervalDays(interval: string) {
  return INTERVAL_TO_DAYS[interval] ?? DEFAULT_INTERVAL_DAYS;
}

function parseNovaReply(reply: string): CalculatorResult {
  return parseCalculatorReply(reply);
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 4,
});

function formatMetricForDisplay(metric: CalculatorSummaryMetric): CalculatorSummaryMetric {
  const rawValue = metric.value;
  if (typeof rawValue !== "number") {
    return metric;
  }

  const label = metric.label.toLowerCase();
  const isCurrency = label.includes("usd") || label.includes("value");
  const formatted = isCurrency ? currencyFormatter.format(rawValue) : numberFormatter.format(rawValue);

  return {
    ...metric,
    value: formatted,
  };
}

function buildDeterministicSummary(
  formState: DcaFormState,
  analysisPackage: DcaPromptAnalysisPackage,
): CalculatorDeterministicSummary {
  const resolvedTokenName = analysisPackage.context.market.token_name ?? formState.token;
  const contribution = Number.parseFloat(formState.amount);
  const formattedContribution = Number.isFinite(contribution)
    ? currencyFormatter.format(contribution)
    : formState.amount;

  const metrics = analysisPackage.metrics.map((metric) =>
    formatMetricForDisplay({ label: metric.label, value: metric.value, unit: metric.unit }),
  );

  const description = `Deploying ${formattedContribution} ${formState.interval.replace(/-/g, " ")} over ${formState.duration}.`;

  const footnotes = analysisPackage.history.summary ? [analysisPackage.history.summary] : undefined;

  return {
    headline: `${resolvedTokenName} DCA projection ready`,
    description,
    metrics,
    footnotes,
  };
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

export const dcaCalculatorDefinition: CalculatorDefinition<DcaFormState, DcaPromptAnalysisPackage> = {
  id: "dca",
  label: "DCA",
  description: "Automate recurring buys to average into a token over time.",
  Form: DcaCalculatorForm,
  getInitialState: () => ({ ...defaultFormState }),
  prepareAnalysis: async (formState) => {
    if (!formState.token?.trim()) {
      throw new Error("Select a token before running the DCA projection.");
    }

    const durationDays = resolveDurationDays(formState.duration, DURATION_TO_DAYS, DEFAULT_DURATION_DAYS);
    const history = await fetchCoindeskHistoryWithSummary({
      symbol: formState.token,
      market: formState.market,
      durationDays,
    });
    const contributionUsd = Number.parseFloat(formState.amount);
    if (!Number.isFinite(contributionUsd) || contributionUsd <= 0) {
      throw new Error("Enter a contribution amount greater than zero.");
    }
    const normalizedContribution = contributionUsd;
    const intervalDays = resolveIntervalDays(formState.interval);
    const analysis = simulateDcaProjection(history, {
      contributionUsd: normalizedContribution,
      intervalDays,
      durationDays,
    });

    const clock = getCurrentUtcClockInfo();
    const modeling: DcaModelingArtifacts = {
      historyHighlights: analysis.history,
      projectionSeries: analysis.projection,
      strategyMetrics: analysis.metrics,
      contributionUsd: normalizedContribution,
      intervalDays,
      durationDays,
    };

    const analysisPackage = createAnalysisPackage(formState, history, clock, modeling);
    const summary = buildDeterministicSummary(formState, analysisPackage);

    const prepared: CalculatorPreparedAnalysis<DcaPromptAnalysisPackage> = {
      analysisPackage,
      dataset: analysis.projection.path,
      summary,
    };

    return prepared;
  },
  getRequestConfig: async (formState, analysis) => {
    const prompt = buildPrompt(formState, analysis.analysisPackage);

    return buildNovaRequestOptions(prompt, { max_tokens: 9000 });
  },
  parseReply: parseNovaReply,
  getSeriesLabel: (formState) => `${formState.token} price`,
  initialSummary: initialSummaryMessage,
  pendingSummary: pendingSummaryMessage,
};
