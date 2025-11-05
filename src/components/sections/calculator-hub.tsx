"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import {
  calculatorDefinitions,
  findCalculatorDefinition,
} from "@/components/calculators";
import type { TimeSeriesPoint } from "@/components/calculators/types";
import { CalculatorDeck } from "@/components/calculators/workspace/CalculatorDeck";
import { CalculatorWorkspace } from "@/components/calculators/workspace/CalculatorWorkspace";
import { PriceTrajectoryPanel } from "@/components/calculators/workspace/PriceTrajectoryPanel";
import { SummaryPanel } from "@/components/calculators/workspace/SummaryPanel";
import { Button } from "@/components/ui/button";
import { clearNovaHistory, requestNova } from "@/lib/nova-client";
import { ensureNovaRefId, resetNovaRefId } from "@/lib/nova-session";
import {
  TrendFollowingChart,
  type TrendFollowingDataPoint,
} from "@/components/calculators/trend-following/trend-following-chart";
import { parseTrendFollowingReply } from "@/components/calculators/trend-following/parser";

const defaultCalculatorId = calculatorDefinitions[0]?.id ?? "";
const defaultDefinition = defaultCalculatorId
  ? findCalculatorDefinition<any>(defaultCalculatorId)
  : undefined;

const defaultSummary =
  defaultDefinition?.initialSummary ??
  "Run a projection to see Nova’s perspective on this plan.";

type CalculatorStateMap = Record<string, unknown>;

export function CalculatorHubSection() {
  const [activeCalculatorId, setActiveCalculatorId] =
    useState(defaultCalculatorId);
  const [calculatorStates, setCalculatorStates] = useState<CalculatorStateMap>(
    () => {
      const initial: CalculatorStateMap = {};
      calculatorDefinitions.forEach((definition) => {
        initial[definition.id] = definition.getInitialState();
      });
      return initial;
    }
  );
  const [isDeckOpen, setIsDeckOpen] = useState(false);
  const [recentCalculatorIds, setRecentCalculatorIds] = useState<string[]>(() =>
    defaultCalculatorId ? [defaultCalculatorId] : []
  );
  const [favoriteCalculatorIds, setFavoriteCalculatorIds] = useState<string[]>(
    []
  );
  const [summary, setSummary] = useState<string>(defaultSummary);
  const [dataset, setDataset] = useState<TimeSeriesPoint[]>([]);
  const [trendFollowingDataset, setTrendFollowingDataset] = useState<
    TrendFollowingDataPoint[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  const activeDefinition = findCalculatorDefinition<any>(activeCalculatorId);

  const formState = (calculatorStates[activeCalculatorId] ??
    activeDefinition?.getInitialState?.() ??
    {}) as Record<string, unknown>;

  const summaryLines = useMemo(() => {
    if (!activeDefinition) {
      return [];
    }

    if (activeDefinition.formatSummary) {
      return activeDefinition.formatSummary(summary);
    }

    return summary
      ? summary
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
      : [];
  }, [activeDefinition, summary]);

  const seriesLabel =
    (activeDefinition?.getSeriesLabel
      ? activeDefinition.getSeriesLabel(formState as any)
      : undefined) ?? "Modeled price";

  const handleFormStateChange = (field: string, value: unknown): void => {
    setCalculatorStates((previous) => {
      const existingState = (previous[activeCalculatorId] ?? {}) as Record<
        string,
        unknown
      >;
      return {
        ...previous,
        [activeCalculatorId]: {
          ...existingState,
          [field]: value,
        },
      };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeDefinition) {
      console.warn(
        "Attempted to submit without an active calculator definition."
      );
      return;
    }

    const currentState = formState;
    const pendingSummary =
      activeDefinition.pendingSummary ??
      "Generating Nova’s latest projection...";

    setIsLoading(true);
    setError(null);
    setDataset([]);
    setTrendFollowingDataset([]);
    setSummary(pendingSummary);

    try {
      const { prompt, options } = activeDefinition.getRequestConfig(
        currentState as any
      );
      const refId = ensureNovaRefId("calculator");
      const { reply } = await requestNova(prompt, options, { refId });

      console.log("reply", reply);

      const calculatorResult = activeDefinition.parseReply(reply);

      console.log("calculatorResult", calculatorResult);

      setSummary(calculatorResult.summary);
      setDataset(calculatorResult.dataset);

      // If this is the trend-following calculator, parse the extended data
      if (activeCalculatorId === "trend-following") {
        const trendFollowingResult = parseTrendFollowingReply(reply);
        setTrendFollowingDataset(trendFollowingResult.dataset);
      }

      if (!calculatorResult.dataset.length) {
        setError(
          "Nova didn't return price history data for this run. Showing the textual summary instead."
        );
      }
    } catch (novaError) {
      console.error("[CalculatorHub] Request error:", novaError);
      const message =
        novaError instanceof Error
          ? novaError.message
          : "Something went wrong when requesting the calculator output.";

      setError(message);
      setDataset([]);
      setTrendFollowingDataset([]);
      setSummary(
        "Nova couldn't complete this request. Please adjust your inputs and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (isClearingHistory) {
      return;
    }

    setIsClearingHistory(true);
    setError(null);

    const refId = ensureNovaRefId("calculator");

    try {
      await clearNovaHistory(refId);
      void resetNovaRefId("calculator");
      setDataset([]);
      setTrendFollowingDataset([]);
      setSummary(activeDefinition?.initialSummary ?? defaultSummary);
    } catch (historyError) {
      console.error(
        "[CalculatorHub] Failed to clear Nova history:",
        historyError
      );
      const message =
        historyError instanceof Error
          ? historyError.message
          : "Unable to clear Nova history right now. Please try again.";
      setError(message);
    } finally {
      setIsClearingHistory(false);
    }
  };

  const handleCalculatorChange = (nextId: string) => {
    if (!nextId) {
      return;
    }

    if (nextId === activeCalculatorId) {
      setIsDeckOpen(false);
      setRecentCalculatorIds((previous) => {
        const filtered = previous.filter((id) => id !== nextId);
        return [nextId, ...filtered].slice(0, 4);
      });
      return;
    }

    const nextDefinition = findCalculatorDefinition<any>(nextId);

    setActiveCalculatorId(nextId);
    setError(null);
    setDataset([]);
    setTrendFollowingDataset([]);
    setIsDeckOpen(false);

    setSummary(nextDefinition?.initialSummary ?? defaultSummary);

    setCalculatorStates((previous) => {
      if (previous[nextId]) {
        return previous;
      }

      if (!nextDefinition) {
        return previous;
      }

      return {
        ...previous,
        [nextId]: nextDefinition.getInitialState(),
      };
    });

    setRecentCalculatorIds((previous) => {
      const filtered = previous.filter((id) => id !== nextId);
      return [nextId, ...filtered].slice(0, 4);
    });
  };

  const handleFavoriteToggle = (calculatorId: string) => {
    setFavoriteCalculatorIds((previous) => {
      if (previous.includes(calculatorId)) {
        return previous.filter((id) => id !== calculatorId);
      }
      return [...previous, calculatorId];
    });
  };

  const CalculatorFormComponent = activeDefinition?.Form ?? null;

  return (
    <CalculatorWorkspace
      controls={
        <>
          <CalculatorDeck
            calculators={calculatorDefinitions.map(
              ({ id, label, description }) => ({ id, label, description })
            )}
            activeId={activeCalculatorId}
            recentIds={recentCalculatorIds}
            favoriteIds={favoriteCalculatorIds}
            isOpen={isDeckOpen}
            onOpen={() => setIsDeckOpen(true)}
            onClose={() => setIsDeckOpen(false)}
            onSelect={handleCalculatorChange}
            onToggleFavorite={handleFavoriteToggle}
          />
          <Button
            type="button"
            variant="ghost"
            onClick={handleClearHistory}
            disabled={isLoading || isClearingHistory}
            className="ml-auto"
          >
            {isClearingHistory ? "Clearing…" : "Clear History"}
          </Button>
        </>
      }
      calculatorPanel={
        CalculatorFormComponent ? (
          <CalculatorFormComponent
            formState={formState as any}
            onFormStateChange={handleFormStateChange as any}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />
        ) : (
          <div className="card-surface flex flex-col items-center justify-center rounded-2xl border border-dashed border-ocean/55 bg-slate-950/40 p-6 text-center text-sm text-muted">
            Select a calculator to begin.
          </div>
        )
      }
      summaryPanel={
        <SummaryPanel
          lines={summaryLines}
          isLoading={isLoading}
          loadingMessage="Nova is compiling the summary and risk notes for this scenario."
        />
      }
      chartPanel={
        activeCalculatorId === "trend-following" ? (
          <TrendFollowingChart
            dataset={trendFollowingDataset}
            isLoading={isLoading}
            token={(formState as any).token ?? "BTC"}
          />
        ) : (
          <PriceTrajectoryPanel
            dataset={dataset}
            isLoading={isLoading}
            seriesLabel={seriesLabel}
          />
        )
      }
    />
  );
}
