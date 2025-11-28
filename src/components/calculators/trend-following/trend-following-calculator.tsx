"use client";

import { useEffect, useMemo, type ChangeEvent } from "react";

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
import { simulateTrendFollowingStrategy } from "@/components/calculators/trend-following/simulator";
import type { TrendFollowingSimulation } from "@/components/calculators/trend-following/types";
import { getDefaultTrendMaPeriod } from "@/components/calculators/trend-following/settings";

export type TrendFollowingFormState = {
  token: string;
  tokenId?: string;
  initialCapital: string;
  maPeriod: string;
  duration: string;
  scenario?: "likely" | "bearish" | "bullish";
};

const defaultFormState: TrendFollowingFormState = {
  token: "BTC",
  tokenId: "bitcoin",
  initialCapital: "10000",
  maPeriod: getDefaultTrendMaPeriod("1 year"),
  duration: "1 year",
  scenario: "likely",
};

const initialSummaryMessage = "Run the projection to see Nova's analysis of this trend-following strategy.";
const pendingSummaryMessage = "Generating Nova's latest projection...";

function buildPrompt(
  formState: TrendFollowingFormState,
  chartProjection?: ChartProjectionData,
  strategySimulation?: TrendFollowingSimulation,
) {
  const { token, initialCapital, maPeriod, duration } = formState;
  const normalizedToken = token.trim() || "the selected asset";
  const projectionPayload = chartProjection ? JSON.stringify(chartProjection) : "null";

  const simulationPayload = strategySimulation ? JSON.stringify(strategySimulation) : "null";

  return joinPromptLines([
    "Below is the projection data already shown in the calculator. It contains historical candles and the active scenario path.",
    "Use those prices only—do not synthesize new series. Whenever you reference returns, time in market, or drawdown, call the calculate_expression tool (max twice), display the formula you evaluated (e.g., (final_equity - initial_capital) / initial_capital), and round the result to at most 5 decimal places.",
    "Every numeric value you mention—including those copied from the simulation—must be rounded to at most five decimal places before returning the response.",
    `Strategy: start with ${initialCapital} USD. Go long ${normalizedToken} when price exceeds the ${maPeriod}-day moving average; otherwise hold stablecoin. Project across ${duration}.`,
    "",
    "A pre-computed moving-average simulation is also provided so you can reference crossovers, time-in-market, and equity without recalculating them.",
    "Return one structured response per the schema below. Keep the language approachable—focus on insights, strategy tips, and risks/mitigations instead of referencing internal code terms.",
    "",
    "Projection data:",
    projectionPayload,
    "",
    "Pre-computed strategy data:",
    simulationPayload,
    "",
    "Use the supplied simulation to cite crossovers, equity curves, and metrics rather than deriving them again.",
    "",
    "Response schema:",
    "{",
    '  "insight": {',
    '    "calculator": {',
    '      "id": "trend-following",',
    '      "label": "Trend-Following",',
    '      "category": "momentum_strategy",',
    '      "version": "v2"',
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
    '        "summary": "Connect Sharpe, drawdown, and returns back to the projected chart.",',
    '        "metrics": [',
    '          { "label": "Strategy total return (%)", "value": 12.5 },',
    '          { "label": "Strategy Sharpe", "value": 0.92 },',
    '          { "label": "Strategy max drawdown (%)", "value": -18.4 }',
    "        ]",
    "      },",
    "      {",
    '        "type": "trade_flow",',
    '        "headline": "Trade cadence & positioning",',
    '        "summary": "Describe how often price crosses the MA and when the position switches.",',
    '        "metrics": [',
    '          { "label": "Time in market (%)", "value": 64 },',
    '          { "label": "Major crossover count", "value": 14 }',
    "        ]",
    "      },",
    "      {",
    '        "type": "risk",',
    '        "headline": "Risks to monitor",',
    '        "summary": "Note sensitivity to whipsaws, volatility, or liquidity constraints.",',
    '        "risks": ["List each material risk in plain language."]',
    "      }",
    "    ],",
    '    "notes": ["Optional reminders or next steps if they help interpret the model."]',
    "  }",
    "}",
    "",
    "Populate metric values with actual calculations; replace template numbers and do not emit trailing commentary.",
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
  onRequestInsights,
  canRequestInsights = false,
  isRequestingInsights = false,
}: CalculatorFormProps<TrendFollowingFormState>) {
  const handleFieldChangeBuilder = buildFieldChangeHandler<TrendFollowingFormState>(onFormStateChange);

  const handleFieldChange =
    (field: keyof TrendFollowingFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      handleFieldChangeBuilder(field)(event.target.value);
    };

  const resolvedMaPeriod = useMemo(
    () => getDefaultTrendMaPeriod(formState.duration),
    [formState.duration],
  );

  useEffect(() => {
    if (formState.maPeriod !== resolvedMaPeriod) {
      onFormStateChange("maPeriod", resolvedMaPeriod);
    }
  }, [formState.maPeriod, onFormStateChange, resolvedMaPeriod]);

  const handleDurationChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextDuration = event.target.value;
    handleFieldChangeBuilder("duration")(nextDuration);
  };

  const selectedScenario = formState.scenario ?? "likely";
  const scenarioOptions: Array<{ value: NonNullable<TrendFollowingFormState["scenario"]>; label: string }> = [
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
            onSelect={(nextValue, asset) => {
              handleFieldChangeBuilder("token")(nextValue);
              handleFieldChangeBuilder("tokenId")(asset?.slug);
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
          <input
            type="text"
            value={`${resolvedMaPeriod}-day MA`}
            readOnly
            className="rounded-xl border border-ocean/60 bg-surface/80 px-3 py-1.5 text-sm text-slate-400 shadow-inner sm:rounded-2xl sm:px-4 sm:py-2 sm:text-base"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-200 sm:gap-2 sm:text-sm">
          Duration
          <select
            value={formState.duration}
            onChange={handleDurationChange}
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
          {isLoading ? "Generating projection..." : "Run trend-following projection"}
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

export const trendFollowingCalculatorDefinition: CalculatorDefinition<TrendFollowingFormState> = {
  id: "trend-following",
  label: "Trend-Following",
  description: "Trade on momentum: go long when price exceeds moving average, hold stablecoin otherwise.",
  Form: TrendFollowingCalculatorForm,
  getInitialState: () => ({ ...defaultFormState }),
  getRequestConfig: (formState, chartProjection, extras) => {
    const simulationFromExtras = extras?.trendSimulation as TrendFollowingSimulation | undefined;
    const simulation =
      simulationFromExtras ??
      (chartProjection
        ? simulateTrendFollowingStrategy({
            chartProjection,
            maPeriod: Number(formState.maPeriod ?? 50),
            initialCapital: Number(formState.initialCapital ?? 10000),
          })
        : undefined);
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
