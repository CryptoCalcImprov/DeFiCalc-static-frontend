"use client";

import type { ChangeEvent } from "react";

import type {
  CalculatorDefinition,
  CalculatorFormProps,
  CalculatorResult,
  ChartProjectionData,
} from "@/components/calculators/types";
import { buildFieldChangeHandler } from "@/components/calculators/utils/forms";
import { joinPromptLines } from "@/components/calculators/utils/prompt";
import { parseCalculatorReply } from "@/components/calculators/utils/summary";
import { buildNovaRequestOptions } from "@/components/calculators/utils/request";
import { TokenSelector } from "@/components/calculators/workspace/TokenSelector";
import type { BuyTheDipSimulation } from "@/components/calculators/buy-the-dip/simulator";

export type BuyTheDipFormState = {
  token: string;
  tokenId?: string;
  budget: string;
  dipThreshold: string;
  duration: string;
  scenario?: "likely" | "bearish" | "bullish";
};

const defaultFormState: BuyTheDipFormState = {
  token: "BTC",
  tokenId: "bitcoin",
  budget: "5000",
  dipThreshold: "10",
  duration: "6 months",
  scenario: "likely",
};

const initialSummaryMessage = "Run the projection to see Nova's perspective on this strategy.";
const pendingSummaryMessage = "Generating Nova's latest projection...";

function buildPrompt(
  formState: BuyTheDipFormState,
  chartProjection?: ChartProjectionData,
  strategySimulation?: BuyTheDipSimulation,
) {
  const { token, budget, dipThreshold, duration } = formState;
  const normalizedToken = token.trim() || "the selected asset";
  const projectionPayload = chartProjection ? JSON.stringify(chartProjection) : "null";
  const parsedBudget = Number(budget);
  const totalBudgetValue = Number.isFinite(parsedBudget) ? parsedBudget : null;
  const parsedDipThreshold = Number(dipThreshold);
  const dipThresholdValue = Number.isFinite(parsedDipThreshold) ? parsedDipThreshold : null;
  const scenarioLabel = typeof formState.scenario === "string" ? formState.scenario : "likely";

  const simulationPayload = strategySimulation
    ? JSON.stringify({
        plan: {
          scenario_label: scenarioLabel,
          dip_threshold_percent: dipThresholdValue ?? dipThreshold,
          total_budget_usd: totalBudgetValue ?? budget,
          trigger_count: strategySimulation.points.length,
          first_trigger_date: strategySimulation.points[0]?.date ?? null,
          last_trigger_date: strategySimulation.points.at(-1)?.date ?? null,
        },
        summary: {
          totalInvested: Number(strategySimulation.metrics.totalInvested.toFixed(5)),
          totalQuantity: Number(strategySimulation.metrics.totalQuantity.toFixed(5)),
          averagePrice: Number(strategySimulation.metrics.averagePrice.toFixed(5)),
        },
        sampleBuys: strategySimulation.points.slice(0, 4).map((point) => ({
          date: point.date,
          amount: Number(point.amount.toFixed(5)),
          price: Number(point.price.toFixed(5)),
          quantity: Number(point.quantity.toFixed(5)),
        })),
      })
    : "null";

  return joinPromptLines([
    "Below is the projection data the calculator already displayed. It combines historical candles with the currently selected scenario path.",
    "Analyze only these prices—do not invent new ones. Whenever you explain averages, deployment percentages, or returns, call the calculate_expression tool (max twice), show the expression you evaluated (e.g., deployed_budget / total_budget), round to at most 5 decimals, and keep the tone friendly.",
    "Every numeric value you mention (even when copying from the data) must be rounded to at most five decimals before returning the response.",
    `Strategy: deploy ${totalBudgetValue ?? budget} USD to buy ${normalizedToken} after ${dipThresholdValue ?? dipThreshold}%+ drops from recent highs within ${duration}.`,
    "The dollar amount above is the entire budget for the plan—not a recurring allocation—so only reference it when dip triggers fire.",
    strategySimulation
      ? `The ${scenarioLabel} path surfaced ${strategySimulation.points.length} dip-triggered buys across this horizon. Stick to these triggers instead of inventing a cadence.`
      : "",
    "",
    "Return a single structured response (schema below) that explains the plan in friendly language. Focus on insights, execution tips, and risk mitigations; do not list every individual buy or reference internal terms like STRATEGY_SIMULATION.",
    "",
    "Projection data:",
    projectionPayload,
    "",
    "Dip-trigger summary:",
    simulationPayload,
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
    '        "headline": "How the budget deploys",',
    '        "summary": "Summarize how the dip triggers guide the pacing.",',
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
    '  "strategy_overlays": [',
    "    {",
    '      "id": "dip-buys",',
    '      "label": "Dip-triggered buys",',
    '      "type": "buy",',
    '      "points": [',
    '        { "date": "YYYY-MM-DD", "price": 123.45 }',
    "      ],",
    '      "metadata": { "dip_threshold_percent": 10, "budget_usd": 5000 }',
    "    }",
    "  ]",
    "}",
    "",
    "Follow the schema exactly, keep explanations conversational, and prioritize insights, tips, and risk mitigations over long numeric lists.",
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
  onRequestInsights,
  canRequestInsights = false,
  isRequestingInsights = false,
}: CalculatorFormProps<BuyTheDipFormState>) {
  const handleFieldChangeBuilder = buildFieldChangeHandler<BuyTheDipFormState>(onFormStateChange);

  const handleFieldChange =
    (field: keyof BuyTheDipFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      handleFieldChangeBuilder(field)(event.target.value);
    };

  const selectedScenario = formState.scenario ?? "likely";
  const scenarioOptions: Array<{ value: NonNullable<BuyTheDipFormState["scenario"]>; label: string }> = [
    { value: "likely", label: "Likely" },
    { value: "bearish", label: "Bearish" },
    { value: "bullish", label: "Bullish" },
  ];
  const insightButtonEnabled = canRequestInsights;

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
            <option value="1 month">1 month</option>
            <option value="3 months">3 months</option>
            <option value="6 months">6 months</option>
            <option value="1 year">1 year</option>
          </select>
        </label>
      </div>
      <div className="rounded-2xl border border-ocean/60 bg-surface/60 p-3 sm:p-4">
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-300 sm:text-sm">
          <span>Scenario</span>
        </div>
        <div className="mt-3 flex gap-2">
          {scenarioOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleFieldChangeBuilder("scenario")(option.value)}
              className={[
                "flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition sm:px-4",
                selectedScenario === option.value
                  ? "border-mint bg-mint/20 text-slate-50"
                  : "border-slate-700/70 text-slate-400 hover:text-slate-100",
              ].join(" ")}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <button
          type="submit"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-cta-gradient px-4 py-2.5 text-xs font-semibold text-slate-50 shadow-lg shadow-[rgba(58,198,255,0.24)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint sm:px-5 sm:py-3 sm:text-sm"
          disabled={isLoading}
        >
          {isLoading ? "Generating projection..." : "Run buy-the-dip projection"}
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M5 3l6 5-6 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          className={[
            "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 sm:px-5 sm:py-3 sm:text-sm",
            insightButtonEnabled
              ? "bg-cta-gradient text-slate-50 shadow-lg shadow-[rgba(58,198,255,0.24)] hover:brightness-110 focus-visible:ring-mint"
              : "border border-slate-700/70 bg-slate-800/60 text-slate-400 focus-visible:ring-slate-400/70",
          ].join(" ")}
          disabled={!insightButtonEnabled}
          onClick={onRequestInsights}
        >
          {isRequestingInsights ? "Generating insights..." : "Generate insights"}
        </button>
      </div>
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
  getRequestConfig: (formState, chartProjection, extras) => {
    const simulation = extras?.strategySimulation as BuyTheDipSimulation | undefined;
    const prompt = buildPrompt(formState, chartProjection, simulation);

    return buildNovaRequestOptions(prompt, {
      max_tokens: 18000,
      chartProjection,
    });
  },
  parseReply: parseNovaReply,
  getSeriesLabel: (formState) => `${formState.token} price`,
  initialSummary: initialSummaryMessage,
  pendingSummary: pendingSummaryMessage,
};
