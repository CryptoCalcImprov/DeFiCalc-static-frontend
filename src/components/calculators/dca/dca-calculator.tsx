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
};

const defaultFormState: DcaFormState = {
  token: "ETH",
  tokenId: "ethereum",
  amount: "500",
  interval: "bi-weekly",
  duration: "6 months",
};

const initialSummaryMessage = "Run the projection to see Nova's perspective on this plan.";
const pendingSummaryMessage = "Generating Nova's latest projection...";

const DURATION_TO_MCP_HORIZON: Record<string, string> = {
  "3 months": "three_months",
  "6 months": "six_months",
  "1 year": "one_year",
};

function buildPrompt(
  formState: DcaFormState,
  simulation?: DcaSimulation,
) {
  const { token, tokenId, amount, interval, duration } = formState;
  const normalizedToken = token.trim() || "the selected asset";
  const simulationPayload = simulation ? JSON.stringify(simulation) : "null";
  const mcpDuration = DURATION_TO_MCP_HORIZON[duration] || "six_months";
  const assetId = tokenId || token.toLowerCase();

  return joinPromptLines([
    `You are assisting with a DCA calculator for ${normalizedToken}.`,
    "Please call the MCP forecast tool (get_forecast) with:",
    `- asset_id: "${assetId}"`,
    '- forecast_type: "long"',
    `- duration: "${mcpDuration}"`,
    '- include_chart: true',
    '- vs_currency: "usd"',
    "",
    "Use the forecast data to analyze the strategy and return a response with:",
    "1. Your insight analysis (following the schema below)",
    "2. chart_data: { historical: [...], projection: [...] } extracted from the forecast tool response",
    "",
    `Strategy: invest ${amount} USD of ${normalizedToken} on a ${interval} cadence for ${duration}.`,
    "",
    "Deliver a single JSON object only. Do not ask questions or add prose outside the schema.",
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
    '    },',
    '    "context": {',
    '      "as_of": "YYYY-MM-DD",',
    `      "asset": "${token}",`,
    '      "inputs": {',
    `        "amount_usd": ${amount},`,
    `        "interval": "${interval}",`,
    `        "duration": "${duration}"`,
    '      },',
    '      "assumptions": ["State the assumptions you used when interpreting the chart projection."]',
    '    },',
    '    "sections": [',
    '      {',
    '        "type": "performance_driver",',
    '        "headline": "Concise label for core performance factor",',
    '        "summary": "1-2 sentences tying the chart projection to the planned contributions.",',
    '        "metrics": [',
    '          { "label": "Total USD invested", "value": 1300 },',
    '          { "label": "Estimated cost basis (USD)", "value": 1.91 }',
    '        ],',
    '        "assumptions": ["Note any assumptions specific to this driver."],',
    '        "risks": ["Highlight sensitivities or risk factors."]',
    '      },',
    '      {',
    '        "type": "risk_assumption",',
    '        "headline": "Key risks & sensitivities",',
    '        "summary": "Explain how volatility or drift could move the curve away from this projection.",',
    '        "risks": ["List each material risk in plain language."]',
    '      }',
    '    ],',
    '    "notes": ["Include optional closing reminders or action items when helpful."]',
    '  },',
    '  "chart_data": {',
    '    "historical": [',
    '      { "date": "ISO string", "open": 0, "high": 0, "low": 0, "close": 0 }',
    '    ],',
    '    "projection": [',
    '      { "date": "ISO string", "mean": 0, "percentile_10": 0, "percentile_90": 0 }',
    '    ],',
    '    "metadata": {',
    '      "confidence": 0.5,',
    '      "technical_signals": { "rsi": 0 }',
    '    }',
    '  }',
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
            onSelect={(nextValue, asset) => {
              handleFieldChangeBuilder("token")(nextValue);
              handleFieldChangeBuilder("tokenId")(asset?.slug);
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
  getRequestConfig: (formState, _chartProjection, extras) => {
    const simulation = extras?.strategySimulation as DcaSimulation | undefined;
    const prompt = buildPrompt(formState, simulation);

    return buildNovaRequestOptions(prompt, {
      max_tokens: 18000,
    });
  },
  parseReply: parseNovaReply,
  getSeriesLabel: (formState) => `${formState.token} price`,
  initialSummary: initialSummaryMessage,
  pendingSummary: pendingSummaryMessage,
};
