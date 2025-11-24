"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import { calculatorDefinitions, findCalculatorDefinition } from "@/components/calculators";
import type {
  CalculatorInsight,
  CoinGeckoCandle,
  StrategyOverlay,
  TimeSeriesPoint,
} from "@/components/calculators/types";
import { CalculatorDeck } from "@/components/calculators/workspace/CalculatorDeck";
import { CalculatorWorkspace } from "@/components/calculators/workspace/CalculatorWorkspace";
import {
  PriceTrajectoryPanel,
  type PriceTrajectoryEventMarker,
  type PriceTrajectoryOverlay,
} from "@/components/calculators/workspace/PriceTrajectoryPanel";
import type { TrendFollowingSimulation } from "@/components/calculators/trend-following/types";
import { simulateTrendFollowingStrategy } from "@/components/calculators/trend-following/simulator";
import { SummaryPanel } from "@/components/calculators/workspace/SummaryPanel";
import { Button } from "@/components/ui/button";
import { clearNovaHistory, requestNova } from "@/lib/nova-client";
import { ensureNovaRefId, resetNovaRefId } from "@/lib/nova-session";
import {
  buildDipTriggerSeries,
  buildMovingAverageSeries,
  buildSeriesFromCandles,
  type TimeSeriesValuePoint,
} from "@/components/calculators/workspace/technical-indicators";
import { MonteCarloHorizons } from "@/lib/monte-carlo";
import type { MonteCarloHorizon, MonteCarloTrajectoryPoint } from "@/lib/monte-carlo";
import { parseTrendFollowingReply } from "@/components/calculators/trend-following/parser";
import { formatSummaryLines } from "@/components/calculators/utils/summary";
import { simulateDcaStrategy, type DcaSimulation } from "@/components/calculators/dca/simulator";

const defaultCalculatorId = calculatorDefinitions[0]?.id ?? "";
const defaultDefinition = defaultCalculatorId ? findCalculatorDefinition<any>(defaultCalculatorId) : undefined;

const defaultSummary =
  defaultDefinition?.initialSummary ?? "Run a projection to see Nova’s perspective on this plan.";

const DISPLAY_WINDOW_MONTHS = 3;
const DURATION_TO_MONTE_CARLO_HORIZON: Record<string, MonteCarloHorizon> = {
  "3 months": MonteCarloHorizons.THREE_MONTHS,
  "6 months": MonteCarloHorizons.SIX_MONTHS,
  "1 year": MonteCarloHorizons.ONE_YEAR,
};

const DURATION_TO_MONTHS: Record<string, number> = {
  "3 months": 3,
  "6 months": 6,
  "1 year": 12,
};

const INTERVAL_TO_DAYS: Record<string, number> = {
  weekly: 7,
  "bi-weekly": 14,
  monthly: 30,
};

function resolveDurationToMonths(duration?: unknown): number {
  if (typeof duration !== "string") {
    return 6;
  }

  const normalized = duration.trim().toLowerCase();
  return DURATION_TO_MONTHS[normalized] ?? 6;
}

function resolveIntervalToDays(interval?: unknown): number {
  if (typeof interval !== "string") {
    return 14;
  }

  const normalized = interval.trim().toLowerCase();
  return INTERVAL_TO_DAYS[normalized] ?? 14;
}

function resolveDurationToMonteCarloHorizon(duration?: unknown): MonteCarloHorizon | undefined {
  if (typeof duration !== "string") {
    return undefined;
  }

  const normalized = duration.trim().toLowerCase();
  return DURATION_TO_MONTE_CARLO_HORIZON[normalized];
}

type CalculatorStateMap = Record<string, unknown>;

export function CalculatorHubSection() {
  const [activeCalculatorId, setActiveCalculatorId] = useState(defaultCalculatorId);
  const [calculatorStates, setCalculatorStates] = useState<CalculatorStateMap>(() => {
    const initial: CalculatorStateMap = {};
    calculatorDefinitions.forEach((definition) => {
      initial[definition.id] = definition.getInitialState();
    });
    return initial;
  });
  const [isDeckOpen, setIsDeckOpen] = useState(false);
  const [recentCalculatorIds, setRecentCalculatorIds] = useState<string[]>(() =>
    defaultCalculatorId ? [defaultCalculatorId] : [],
  );
  const [favoriteCalculatorIds, setFavoriteCalculatorIds] = useState<string[]>([]);
  const [summaryMessage, setSummaryMessage] = useState<string>(defaultSummary);
  const [insight, setInsight] = useState<CalculatorInsight | null>(null);
  const [fallbackLines, setFallbackLines] = useState<string[]>([]);
  const [novaDataset, setNovaDataset] = useState<TimeSeriesPoint[]>([]);
  const [priceHistory, setPriceHistory] = useState<CoinGeckoCandle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [monteCarloTrajectory, setMonteCarloTrajectory] = useState<MonteCarloTrajectoryPoint[] | null>(null);
  const [forecastPercentiles, setForecastPercentiles] = useState<{
    lower: MonteCarloTrajectoryPoint[];
    upper: MonteCarloTrajectoryPoint[];
  } | null>(null);
  const [strategyOverlays, setStrategyOverlays] = useState<StrategyOverlay[]>([]);
  const [dcaSimulation, setDcaSimulation] = useState<DcaSimulation | null>(null);
  const [projectionStartTimestamp, setProjectionStartTimestamp] = useState(0);

  const activeDefinition = findCalculatorDefinition<any>(activeCalculatorId);

  const formState = (calculatorStates[activeCalculatorId] ??
    activeDefinition?.getInitialState?.() ??
    {}) as Record<string, unknown>;

  const seriesLabel =
    (activeDefinition?.getSeriesLabel ? activeDefinition.getSeriesLabel(formState as any) : undefined) ?? "Modeled price";

  const dipThresholdString = String((formState as Record<string, unknown>).dipThreshold ?? "");
  const durationInput = typeof formState.duration === "string" ? formState.duration : undefined;
  // This is no longer needed for local calculation, but kept for simulation logic consistency if needed
  const monteCarloHorizon = useMemo(
    () => resolveDurationToMonteCarloHorizon(durationInput),
    [durationInput],
  );
  const { displayDataset, displayWindowStart } = useMemo(() => {
    if (!priceHistory.length) {
      return { displayDataset: priceHistory, displayWindowStart: 0 };
    }

    const latestCandle = priceHistory[priceHistory.length - 1];
    const latestDate = new Date(latestCandle.date);
    const windowStartDate = new Date(latestDate);
    windowStartDate.setMonth(windowStartDate.getMonth() - DISPLAY_WINDOW_MONTHS);
    const windowStartTimestamp = windowStartDate.getTime();

    const filtered = priceHistory.filter((candle) => new Date(candle.date).getTime() >= windowStartTimestamp);
    return {
      displayDataset: filtered.length ? filtered : priceHistory,
      displayWindowStart: filtered.length ? windowStartTimestamp : 0,
    };
  }, [priceHistory]);

  const historicalSeries = useMemo<TimeSeriesValuePoint[]>(() => buildSeriesFromCandles(priceHistory), [priceHistory]);

  const combinedSeries = useMemo<TimeSeriesValuePoint[]>(() => {
    if (!monteCarloTrajectory?.length) {
      return historicalSeries;
    }

    const merged = [...historicalSeries, ...monteCarloTrajectory.map((point) => ({ x: point.x, y: point.y }))];
    merged.sort((a, b) => a.x - b.x);
    return merged;
  }, [historicalSeries, monteCarloTrajectory]);

  const { technicalOverlays, eventMarkers } = useMemo(() => {
    if (!combinedSeries.length) {
      return { technicalOverlays: [], eventMarkers: [] };
    }

    const overlays: PriceTrajectoryOverlay[] = [];
    const markers: PriceTrajectoryEventMarker[] = [];

    if (activeCalculatorId === "dca") {
      overlays.push(
        {
          id: "dca-sma-20",
          label: "20-day SMA",
          data: buildMovingAverageSeries(combinedSeries, 20),
          color: "rgba(56, 189, 248, 0.95)",
        },
        {
          id: "dca-sma-60",
          label: "60-day SMA",
          data: buildMovingAverageSeries(combinedSeries, 60),
          color: "rgba(129, 140, 248, 0.9)",
          borderDash: [4, 4],
        },
      );
      if (dcaSimulation?.points.length) {
        markers.push({
          id: "dca-scheduled-buys",
          label: "Scheduled DCA buys",
          points: dcaSimulation.points
            .map((point) => {
              const timestamp = new Date(point.date).getTime();
              if (!Number.isFinite(timestamp) || !Number.isFinite(point.price)) {
                return null;
              }
              return {
                x: timestamp,
                y: point.price,
                meta: {
                  action: `Buy $${point.amount.toFixed(2)}`,
                  amount: point.amount,
                  quantity: point.quantity,
                  price: point.price,
                  date: point.date,
                },
              };
            })
            .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
          backgroundColor: "rgba(236, 72, 153, 0.85)",
          borderColor: "rgba(219, 39, 119, 1)",
          radius: 4,
        });
      }
    } else if (activeCalculatorId === "buy-the-dip") {
      overlays.push({
        id: "buy-dip-sma-20",
        label: "20-day SMA",
        data: buildMovingAverageSeries(combinedSeries, 20),
        color: "rgba(16, 185, 129, 0.85)",
      });

      const parsedThreshold = Number.parseFloat(dipThresholdString);
      const normalizedThreshold = Number.isFinite(parsedThreshold) ? parsedThreshold : 10;
      const dipSeries = buildDipTriggerSeries(combinedSeries, normalizedThreshold, 30);

      if (dipSeries.recentHighs.length) {
        overlays.push({
          id: "buy-dip-recent-high",
          label: "30-day recent high",
          data: dipSeries.recentHighs,
          color: "rgba(251, 191, 36, 0.9)",
          borderDash: [6, 4],
        });
      }

      if (dipSeries.thresholdLine.length) {
        overlays.push({
          id: "buy-dip-threshold",
          label: `${normalizedThreshold}% dip threshold`,
          data: dipSeries.thresholdLine,
          color: "rgba(248, 113, 113, 0.9)",
          borderDash: [2, 4],
          strokeWidth: 1.5,
        });
      }

      if (dipSeries.dipEvents.length) {
        markers.push({
          id: "buy-dip-events",
          label: "Dip triggers",
          points: dipSeries.dipEvents.map((point) => ({
            ...point,
            meta: {
              action: `${normalizedThreshold}% dip trigger`,
              price: point.y,
              date: new Date(point.x).toISOString().slice(0, 10),
            },
          })),
          backgroundColor: "rgba(239, 68, 68, 0.7)",
          borderColor: "rgba(220, 38, 38, 1)",
          radius: 5,
        });
      }
    } else if (activeCalculatorId === "trend-following") {
      const definedPeriods = [50, 100, 200];
      definedPeriods.forEach((period, index) => {
        overlays.push({
          id: `trend-ma-${period}`,
          label: `${period}-day SMA`,
          data: buildMovingAverageSeries(combinedSeries, period),
          color: index === 0 ? "rgba(59, 130, 246, 0.95)" : index === 1 ? "rgba(16, 185, 129, 0.9)" : "rgba(236, 72, 153, 0.9)",
          borderDash: index === 0 ? undefined : [4, 4],
          strokeWidth: 2,
        });
      });
    }

    const clipHistoricalPoints = <T extends { x: number }>(points: T[]) => {
      const start = displayWindowStart;
      return points.filter((point) => point.x >= start);
    };

    const clipStrategyPoints = <T extends { x: number }>(points: T[]) =>
      projectionStartTimestamp ? points.filter((point) => point.x >= projectionStartTimestamp) : points;

    const filteredOverlays = overlays
      .map((overlay) => ({
        ...overlay,
        data: clipHistoricalPoints(overlay.data),
      }))
      .filter((overlay) => overlay.data.length);

    const filteredMarkers = markers
      .map((marker) => ({
        ...marker,
        points: clipStrategyPoints(marker.points),
      }))
      .filter((marker) => marker.points.length);

    return { technicalOverlays: filteredOverlays, eventMarkers: filteredMarkers };
  }, [activeCalculatorId, combinedSeries, dipThresholdString, dcaSimulation, projectionStartTimestamp, displayWindowStart]);

  const strategyEventMarkers = useMemo<PriceTrajectoryEventMarker[]>(() => {
    if (!strategyOverlays.length) {
      return [];
    }

    const palette: Record<StrategyOverlay["type"], { background: string; border: string }> = {
      buy: {
        background: "rgba(16, 185, 129, 0.85)",
        border: "rgba(16, 185, 129, 1)",
      },
      sell: {
        background: "rgba(239, 68, 68, 0.75)",
        border: "rgba(248, 113, 113, 1)",
      },
      annotation: {
        background: "rgba(236, 72, 153, 0.95)", // neon pink for strategy annotations
        border: "rgba(219, 39, 119, 1)",
      },
    };

    return strategyOverlays
      .map((overlay) => {
        const points = overlay.points
          .map((point) => {
            const timestamp = new Date(point.date).getTime();
            if (!Number.isFinite(timestamp) || !Number.isFinite(point.price)) {
              return null;
            }

            const actionFromMetadata =
              typeof overlay.metadata?.action === "string" ? overlay.metadata.action : undefined;
            const action =
              actionFromMetadata ??
              (overlay.type === "buy"
                ? "Buy signal"
                : overlay.type === "sell"
                  ? "Sell signal"
                  : overlay.label);

            return {
              x: timestamp,
              y: point.price,
              meta: {
                action,
                description: overlay.label,
                price: point.price,
                date: point.date,
              },
            };
          })
          .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

        if (!points.length) {
          return null;
        }

        const colors = palette[overlay.type];
        return {
          id: overlay.id,
          label: overlay.label,
          points,
          backgroundColor: colors.background,
          borderColor: colors.border,
          radius: overlay.type === "annotation" ? 6 : 4,
        } as PriceTrajectoryEventMarker;
      })
      .filter(Boolean) as PriceTrajectoryEventMarker[];
  }, [strategyOverlays]);

  const combinedEventMarkers = useMemo(
    () => [...eventMarkers, ...strategyEventMarkers],
    [eventMarkers, strategyEventMarkers],
  );

  const handleFormStateChange = (field: string, value: unknown): void => {
    setCalculatorStates((previous) => {
      const existingState = (previous[activeCalculatorId] ?? {}) as Record<string, unknown>;
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
      console.warn("Attempted to submit without an active calculator definition.");
      return;
    }

    const currentState = formState;
    const pendingSummary = activeDefinition.pendingSummary ?? "Generating Nova’s latest projection...";

    setIsLoading(true);
    setError(null);
    setNovaDataset([]);
    setInsight(null);
    setFallbackLines([]);
    setSummaryMessage(pendingSummary);
    setStrategyOverlays([]);
    setPriceHistory([]);
    setMonteCarloTrajectory(null);
    setForecastPercentiles(null);
    setDcaSimulation(null);
    setProjectionStartTimestamp(0);

    let trendSimulation: TrendFollowingSimulation | null = null;
    let dcaSim: DcaSimulation | null = null;
    let simulationOverlay: StrategyOverlay | null = null;

    try {
      const extras: Record<string, unknown> = {};
      
      const { prompt, options } = activeDefinition.getRequestConfig(
        currentState as any,
        undefined, // No chartProjection available yet
        extras,
      );
      
      const refId = ensureNovaRefId("calculator");
      const { reply } = await requestNova(prompt, options, { refId });

      const {
        insight: parsedInsight,
        dataset: parsedDataset,
        fallbackSummary: parsedFallbackSummary,
        fallbackLines: parsedFallbackLines,
        strategyOverlays: parsedStrategyOverlays,
        chartData: parsedChartData,
      } = activeDefinition.parseReply(reply);

      console.log("[CalculatorHub] Parsed reply result:", {
        hasInsight: !!parsedInsight,
        datasetLength: parsedDataset.length,
        hasChartData: !!parsedChartData,
        chartData: parsedChartData,
      });

      if (!parsedChartData) {
        console.error("[CalculatorHub] No chart data returned from Nova");
        throw new Error("Nova did not return chart data. Please try again.");
      }

      console.log("[CalculatorHub] Setting price history:", {
        historicalCount: parsedChartData.historical.length,
        projectionCount: parsedChartData.projection.length,
        firstHistorical: parsedChartData.historical[0],
        firstProjection: parsedChartData.projection[0],
      });

      setPriceHistory(parsedChartData.historical);
      const trajectory = parsedChartData.projection.map(p => ({
        x: new Date(p.date).getTime(),
        y: p.mean, // Use mean price for the trajectory line
      }));
      
      console.log("[CalculatorHub] Setting trajectory:", {
        trajectoryLength: trajectory.length,
        firstPoint: trajectory[0],
        lastPoint: trajectory[trajectory.length - 1],
      });
      
      setMonteCarloTrajectory(trajectory);

      const lowerBand = parsedChartData.projection.map((point) => ({
        x: new Date(point.date).getTime(),
        y: point.percentile_10,
      }));
      const upperBand = parsedChartData.projection.map((point) => ({
        x: new Date(point.date).getTime(),
        y: point.percentile_90,
      }));
      setForecastPercentiles({ lower: lowerBand, upper: upperBand });
      
      const projectionSeries = parsedChartData.projection.map((point) => ({
        timestamp: new Date(point.date).getTime(),
        price: point.mean,
        date: point.date,
      }));
      setProjectionStartTimestamp(projectionSeries[0]?.timestamp ?? 0);

      const chartProjectionForSim = {
        historical_data: parsedChartData.historical,
        projection: trajectory,
        metadata: {
          asset: (currentState as any).token || "asset",
          as_of: new Date().toISOString(),
          projection_horizon_months: resolveDurationToMonteCarloHorizon((currentState as any).duration) ?? MonteCarloHorizons.SIX_MONTHS,
        }
      };

      if (activeCalculatorId === "trend-following") {
        const maPeriodValue = Number((currentState as Record<string, unknown>).maPeriod ?? 50);
        const initialCapitalValue = Number((currentState as Record<string, unknown>).initialCapital ?? 10000);

        if (Number.isFinite(maPeriodValue) && Number.isFinite(initialCapitalValue)) {
          trendSimulation = simulateTrendFollowingStrategy({
            chartProjection: chartProjectionForSim,
            maPeriod: maPeriodValue,
            initialCapital: initialCapitalValue,
          });

          if (trendSimulation.crossovers.length) {
            simulationOverlay = {
              id: "trend-sim-crossovers",
              label: "Modeled crossovers",
              type: "annotation",
              points: trendSimulation.crossovers,
              metadata: { source: "simulated" },
            };
          }
        }
      } else if (activeCalculatorId === "dca") {
        const amountValue = Number((currentState as Record<string, unknown>).amount ?? 0);
        const intervalValue = typeof currentState.interval === "string" ? currentState.interval : "bi-weekly";
        const durationValue = typeof currentState.duration === "string" ? currentState.duration : "6 months";
        const intervalDays = resolveIntervalToDays(intervalValue);
        const durationMonths = resolveDurationToMonths(durationValue);

        if (Number.isFinite(amountValue) && amountValue > 0) {
          dcaSim = simulateDcaStrategy({
            projectionSeries,
            amountPerContribution: amountValue,
            intervalDays,
            durationMonths,
          });
          setDcaSimulation(dcaSim);
        }
      }

      const trendResult =
        activeCalculatorId === "trend-following"
          ? parseTrendFollowingReply(reply)
          : null;

      setInsight(parsedInsight ?? null);
      setNovaDataset(parsedDataset);

      const overlaysToUse = simulationOverlay
        ? [simulationOverlay]
        : parsedStrategyOverlays ?? [];
      setStrategyOverlays(overlaysToUse);

      if (parsedInsight) {
        setSummaryMessage("");
        setFallbackLines([]);
      } else {
        let fallbackSummaryText = parsedFallbackSummary;
        let fallbackSummaryLines = parsedFallbackLines ?? [];

        if (
          !fallbackSummaryText &&
          !fallbackSummaryLines.length &&
          activeCalculatorId === "trend-following" &&
          trendResult?.summary
        ) {
          fallbackSummaryText = trendResult.summary;
          fallbackSummaryLines = formatSummaryLines(trendResult.summary);
        }

        setFallbackLines(fallbackSummaryLines);
        const summaryText =
          fallbackSummaryText ??
          (fallbackSummaryLines.length ? "" : "Nova did not return a structured summary for this run.");
        setSummaryMessage(summaryText);
      }

    } catch (novaError) {
      console.error("[CalculatorHub] Request error:", novaError);
      const message =
        novaError instanceof Error
          ? novaError.message
          : "Something went wrong when requesting the calculator output.";

      setError(message);
      setNovaDataset([]);
      setInsight(null);
      setFallbackLines([]);
      setStrategyOverlays([]);
      setPriceHistory([]);
      setMonteCarloTrajectory(null);
      setForecastPercentiles(null);
      setDcaSimulation(null);
      setProjectionStartTimestamp(0);
      setSummaryMessage("Nova couldn't complete this request. Please adjust your inputs and try again.");
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
      setNovaDataset([]);
      setPriceHistory([]);
      setMonteCarloTrajectory(null);
      setForecastPercentiles(null);
      setStrategyOverlays([]);
      setDcaSimulation(null);
      setProjectionStartTimestamp(0);
      setInsight(null);
      setFallbackLines([]);
      setSummaryMessage(activeDefinition?.initialSummary ?? defaultSummary);
    } catch (historyError) {
      console.error("[CalculatorHub] Failed to clear Nova history:", historyError);
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
    setNovaDataset([]);
    setIsDeckOpen(false);

    setInsight(null);
    setFallbackLines([]);
    setSummaryMessage(nextDefinition?.initialSummary ?? defaultSummary);
    setPriceHistory([]);
    setMonteCarloTrajectory(null);
    setForecastPercentiles(null);
    setStrategyOverlays([]);
    setDcaSimulation(null);
    setProjectionStartTimestamp(0);

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

  const projectionOverlays = useMemo(() => {
    const overlays: PriceTrajectoryOverlay[] = [];

    if (forecastPercentiles?.upper?.length) {
      overlays.push({
        id: "nova-forecast-upper",
        label: "Nova Forecast (p90)",
        data: forecastPercentiles.upper,
        color: "rgba(251, 173, 92, 0.9)",
        backgroundColor: "rgba(251, 173, 92, 0.08)",
        borderDash: [2, 2],
        strokeWidth: 1.5,
        tension: 0.2,
        pointRadius: 0,
        order: 45,
      });
    }

    if (monteCarloTrajectory?.length) {
      console.log("[CalculatorHub] Creating projection overlay:", {
        dataLength: monteCarloTrajectory.length,
        firstPoint: monteCarloTrajectory[0],
        lastPoint: monteCarloTrajectory[monteCarloTrajectory.length - 1],
      });

      overlays.push({
        id: "nova-forecast-mean",
        label: "Nova Forecast (mean)",
        data: monteCarloTrajectory,
        color: "#FBA94C",
        backgroundColor: "rgba(251, 169, 76, 0.15)",
        strokeWidth: 2.5,
        borderDash: [6, 4],
        tension: 0.3,
        pointRadius: 0,
        fill: false,
        yAxisID: undefined,
        order: 50,
      });
    }

    if (forecastPercentiles?.lower?.length) {
      overlays.push({
        id: "nova-forecast-lower",
        label: "Nova Forecast (p10)",
        data: forecastPercentiles.lower,
        color: "rgba(239, 109, 86, 0.9)",
        backgroundColor: "rgba(239, 109, 86, 0.08)",
        borderDash: [2, 2],
        strokeWidth: 1.5,
        tension: 0.2,
        pointRadius: 0,
        order: 55,
      });
    }

    if (!overlays.length) {
      console.log("[CalculatorHub] No trajectory for projection overlay");
    }

    return overlays;
  }, [forecastPercentiles, monteCarloTrajectory]);

  const CalculatorFormComponent = activeDefinition?.Form ?? null;
  const priceTrajectoryPanel = (
    <PriceTrajectoryPanel
      dataset={displayDataset}
      isLoading={isLoading}
      seriesLabel={seriesLabel}
      technicalOverlays={technicalOverlays}
      eventMarkers={combinedEventMarkers}
      projectionOverlays={projectionOverlays}
      loadingMessage="Nova is analyzing market data and generating projections..."
      emptyMessage={
        error ?? "Run the projection to visualize Nova's forecast and strategy analysis."
      }
    />
  );

  return (
    <CalculatorWorkspace
      controls={
        <>
          <CalculatorDeck
            calculators={calculatorDefinitions.map(({ id, label, description }) => ({ id, label, description }))}
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
          insight={insight}
          fallbackLines={fallbackLines}
          fallbackMessage={summaryMessage}
          isLoading={isLoading}
          loadingMessage="Nova is compiling the summary and risk notes for this scenario."
        />
      }
      chartPanel={priceTrajectoryPanel}
    />
  );
}
