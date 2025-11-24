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

const DURATION_TO_MCP_HORIZON: Record<string, string> = {
  "3 months": "three_months",
  "6 months": "six_months",
  "1 year": "one_year",
};

function buildPrompt(formState: BuyTheDipFormState) {
  const { token, tokenId, budget, dipThreshold, duration } = formState;
  const normalizedToken = token.trim() || "the selected asset";
  const mcpDuration = DURATION_TO_MCP_HORIZON[duration] || "six_months";
  const assetId = tokenId || token.toLowerCase();

  return joinPromptLines([
    `You are assisting with a Buy the Dip calculator for ${normalizedToken}.`,
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
    `Strategy: deploy ${budget} USD to buy ${normalizedToken} after ${dipThreshold}%+ drops from recent highs within ${duration}.`,
    "",
    "Return JSON only. Use the schema below, which includes `insight` and a `strategy_overlays` array for your annotations.",
    "",
    "Response schema:",
    "{",
    '  "insight": {',
    '    "calculator": {',
    '      "id": "buy-the-dip",',
    '      "label": "Buy the Dip",',
    '      "category": "opportunistic_entry",',
    '      "version": "v2"',
    '    },',
    '    "context": {',
    '      "as_of": "YYYY-MM-DD",',
    `      "asset": "${token}",`,
    '      "inputs": {',
    `        "budget_usd": ${budget},`,
    `        "dip_threshold_percent": ${dipThreshold},`,
    `        "duration": "${duration}"`,
    '      },',
    '      "assumptions": ["Capture major modeling assumptions here."]',
    '    },',
    '    "sections": [',
    '      {',
    '        "type": "deployment_plan",',
    '        "headline": "How the budget deploys",',
    '        "summary": "Summarize how the dip triggers guide the pacing.",',
    '        "metrics": [',
    '          { "label": "Total budget (USD)", "value": 5000 },',
    '          { "label": "Budget deployed (USD)", "value": 3800 },',
    '          { "label": "Purchases triggered", "value": 7 }',
    '        ],',
    '        "assumptions": ["Clarify rebound thresholds, cooling periods, etc."]',
    '      },',
    '      {',
    '        "type": "performance_driver",',
    '        "headline": "Price dynamics & opportunity set",',
    '        "summary": "Explain the path of highs, dips, and modeled execution prices.",',
    '        "risks": ["Note slippage, liquidity, or volatility risks."]',
    '      },',
    '      {',
    '        "type": "risk_assumption",',
    '        "headline": "Key risks & monitoring",',
    '        "summary": "Highlight conditions that could break the plan.",',
    '        "risks": ["List each risk plainly."]',
    '      }',
    '    ],',
    '    "notes": ["Optional closing reminders or next steps."]',
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
    '  },',
    '  "strategy_overlays": [',
    '    {',
    '      "id": "dip-buys",',
    '      "label": "Dip-triggered buys",',
    '      "type": "buy",',
    '      "points": [',
    '        { "date": "YYYY-MM-DD", "price": 123.45 }',
    '      ],',
    '      "metadata": { "dip_threshold_percent": 10, "budget_usd": 5000 }',
    '    }',
    '  ]',
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
  getRequestConfig: (formState, _chartProjection) => {
    const prompt = buildPrompt(formState);

    return buildNovaRequestOptions(prompt, {
      max_tokens: 18000,
    });
  },
  parseReply: parseNovaReply,
  getSeriesLabel: (formState) => `${formState.token} price`,
  initialSummary: initialSummaryMessage,
  pendingSummary: pendingSummaryMessage,
};
