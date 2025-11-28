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
import type { DcaSimulation } from "@/components/calculators/dca/simulator";
export type DcaFormState = {
  token: string;
  tokenId?: string;
  amount: string;
  interval: string;
  duration: string;
  scenario?: "likely" | "bearish" | "bullish";
};

const defaultFormState: DcaFormState = {
  token: "ETH",
  tokenId: "ethereum",
  amount: "500",
  interval: "bi-weekly",
  duration: "6 months",
  scenario: "likely",
};

const initialSummaryMessage = "Run the projection to see Nova's perspective on this plan.";
const pendingSummaryMessage = "Generating Nova's latest projection...";

function buildPrompt(
  formState: DcaFormState,
  chartProjection?: ChartProjectionData,
  simulation?: DcaSimulation,
) {
  const { token, amount, interval, duration } = formState;
  const normalizedToken = token.trim() || "the selected asset";
  const projectionPayload = chartProjection ? JSON.stringify(chartProjection) : "null";
  const simulationPayload = simulation ? JSON.stringify(simulation) : "null";

  return joinPromptLines([
    "You are given a curated chart projection (CHART_PROJECTION) that contains historical candles and a Monte Carlo forecast.",
    "Use the projection data and only the prices provided—do not invent additional price paths.",
    `Strategy: invest a total of ${amount} USD into ${normalizedToken}, distributing buys on a ${interval} cadence for ${duration}.`,
    "",
    "Deliver a single JSON object only. Do not ask questions or add prose outside the schema.",
    "",
    "CHART_PROJECTION:",
    projectionPayload,
    "",
    "STRATEGY_SIMULATION:",
    simulationPayload,
    "",
    "Use STRATEGY_SIMULATION to reference the daily scheduled contribution dates, prices, quantities, and metrics. Do not recompute the schedule or emit strategy_overlays.",
    "",
    "Response schema:",
    "{",
    '  "insight": {',
    '    "calculator": {',
    '      "id": "dca",',
    '      "label": "Dollar-Cost Averaging",',
    '      "category": "accumulation",',
    '      "version": "v2"',
    "    },",
    '    "context": {',
    '      "as_of": "YYYY-MM-DD",',
    `      "asset": "${token}",`,
    '      "inputs": {',
    `        "amount_usd": ${amount},`,
    `        "interval": "${interval}",`,
    `        "duration": "${duration}"`,
    "      },",
    '      "assumptions": ["State the assumptions you used when interpreting the chart projection."]',
    "    },",
    '    "sections": [',
    "      {",
    '        "type": "performance_driver",',
    '        "headline": "Concise label for core performance factor",',
    '        "summary": "1-2 sentences tying the chart projection to the planned contributions.",',
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
    '        "summary": "Explain how volatility or drift could move the curve away from this projection.",',
    '        "risks": ["List each material risk in plain language."]',
    "      }",
    "    ],",
    '    "notes": ["Include optional closing reminders or action items when helpful."]',
    "  }",
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
  onRequestInsights,
  canRequestInsights = false,
  isRequestingInsights = false,
}: CalculatorFormProps<DcaFormState>) {
  const handleFieldChangeBuilder = buildFieldChangeHandler<DcaFormState>(onFormStateChange);

  const handleFieldChange =
    (field: keyof DcaFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      handleFieldChangeBuilder(field)(event.target.value);
    };

  const selectedScenario = formState.scenario ?? "likely";
  const scenarioOptions: Array<{ value: NonNullable<DcaFormState["scenario"]>; label: string }> = [
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
        <h3 className="text-lg font-semibold text-slate-50 sm:text-xl">Configure your DCA plan</h3>
        <p className="mt-1.5 text-xs text-muted sm:mt-2 sm:text-sm">
          Adjust token, total contribution size, cadence, and horizon to see how Nova models accumulation over time.
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
            placeholder="e.g. ETH"
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-200 sm:gap-2 sm:text-sm">
          Total contribution (USD)
          <input
            type="number"
            min="10"
            step="10"
            value={formState.amount}
            onChange={handleFieldChange("amount")}
            className="rounded-xl border border-ocean/60 bg-surface/90 px-3 py-1.5 text-sm text-slate-50 placeholder:text-slate-500 shadow-inner focus:border-mint focus:bg-surface/95 focus:outline-none focus:ring-1 focus:ring-mint/35 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-base"
            placeholder="e.g. 5000"
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
          {isLoading ? "Generating projection..." : "Run DCA projection"}
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

export const dcaCalculatorDefinition: CalculatorDefinition<DcaFormState> = {
  id: "dca",
  label: "DCA",
  description: "Automate recurring buys to average into a token over time.",
  Form: DcaCalculatorForm,
  getInitialState: () => ({ ...defaultFormState }),
  getRequestConfig: (formState, chartProjection, extras) => {
    const simulation = extras?.strategySimulation as DcaSimulation | undefined;
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
