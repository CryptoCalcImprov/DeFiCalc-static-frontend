"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import { calculatorDefinitions, findCalculatorDefinition } from "@/components/calculators";
import type {
  CalculatorInsight,
  CoinGeckoCandle,
  ForecastProjectionPoint,
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
import { searchAssets } from "@/lib/coingecko-client";
import {
  buildDipTriggerSeries,
  buildMovingAverageSeries,
  buildSeriesFromCandles,
  type TimeSeriesValuePoint,
} from "@/components/calculators/workspace/technical-indicators";
import { parseTrendFollowingReply } from "@/components/calculators/trend-following/parser";
import { formatSummaryLines } from "@/components/calculators/utils/summary";
import { simulateDcaStrategy, type DcaSimulation } from "@/components/calculators/dca/simulator";

const defaultCalculatorId = calculatorDefinitions[0]?.id ?? "";
const defaultDefinition = defaultCalculatorId ? findCalculatorDefinition<any>(defaultCalculatorId) : undefined;

const defaultSummary =
  defaultDefinition?.initialSummary ?? "Run a projection to see Nova’s perspective on this plan.";

const DISPLAY_WINDOW_MONTHS = 3;
const DURATION_TO_FORECAST_PARAM: Record<string, string> = {
  "3 months": "three_months",
  "6 months": "six_months",
  "1 year": "one_year",
  "2 years": "two_years",
  "3 years": "three_years",
};

const MAX_FORECAST_LINE_POINTS = 400;

const DURATION_TO_MONTHS: Record<string, number> = {
  "3 months": 3,
  "6 months": 6,
  "1 year": 12,
  "2 years": 24,
  "3 years": 36,
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

function resolveDurationToForecast(duration?: unknown): string {
  if (typeof duration !== "string") {
    return "six_months";
  }

  const normalized = duration.trim().toLowerCase();
  return DURATION_TO_FORECAST_PARAM[normalized] ?? "six_months";
}

function resolveIntervalToDays(interval?: unknown): number {
  if (typeof interval !== "string") {
    return 14;
  }

  const normalized = interval.trim().toLowerCase();
  return INTERVAL_TO_DAYS[normalized] ?? 14;
}

function downsampleSeries<T extends { x: number; y: number }>(points: T[], maxPoints: number): T[] {
  if (!Array.isArray(points) || points.length <= maxPoints || maxPoints <= 0) {
    return points;
  }

  const stride = Math.ceil(points.length / maxPoints);
  const result: T[] = [];

  for (let index = 0; index < points.length; index += stride) {
    result.push(points[index]);
  }

  const lastPoint = points[points.length - 1];
  if (result[result.length - 1] !== lastPoint) {
    result.push(lastPoint);
  }

  return result;
}

async function searchCoinGeckoAssetId(query: string): Promise<string | null> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return null;
  }

  const assets = await searchAssets(normalizedQuery);
  if (assets.length === 0) {
    return null;
  }

  // Return the slug (CoinGecko ID) of the first result
  return assets[0]?.slug ?? null;
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
  const [isPriceHistoryLoading, setIsPriceHistoryLoading] = useState(false);
  const [priceHistoryError, setPriceHistoryError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [forecastProjection, setForecastProjection] = useState<ForecastProjectionPoint[]>([]);
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

  const forecastMeanSeries = useMemo<TimeSeriesValuePoint[]>(() => {
    if (!forecastProjection.length) {
      return [];
    }

    return forecastProjection
      .map((point) => {
        const timestamp = new Date(point.timestamp).getTime();
        if (!Number.isFinite(timestamp) || !Number.isFinite(point.mean)) {
          return null;
        }
        return { x: timestamp, y: point.mean };
      })
      .filter((entry): entry is TimeSeriesValuePoint => Boolean(entry));
  }, [forecastProjection]);

  const combinedSeries = useMemo<TimeSeriesValuePoint[]>(() => {
    if (!forecastMeanSeries.length) {
      return historicalSeries;
    }

    const merged = [...historicalSeries, ...forecastMeanSeries];
    merged.sort((a, b) => a.x - b.x);
    return merged;
  }, [historicalSeries, forecastMeanSeries]);

  const { technicalOverlays, eventMarkers } = useMemo(() => {
    if (!combinedSeries.length) {
      return { technicalOverlays: [], eventMarkers: [] };
    }

    const overlays: PriceTrajectoryOverlay[] = [];
    const markers: PriceTrajectoryEventMarker[] = [];

    if (forecastProjection.length) {
      const meanOverlayPoints: PriceTrajectoryOverlay["data"] = [];
      const upperOverlayPoints: PriceTrajectoryOverlay["data"] = [];
      const lowerOverlayPoints: PriceTrajectoryOverlay["data"] = [];

      forecastProjection.forEach((point) => {
        const timestamp = new Date(point.timestamp).getTime();
        if (!Number.isFinite(timestamp)) {
          return;
        }
        if (Number.isFinite(point.mean)) {
          meanOverlayPoints.push({ x: timestamp, y: point.mean });
        }
        if (Number.isFinite(point.percentile_90)) {
          upperOverlayPoints.push({ x: timestamp, y: point.percentile_90 as number });
        }
        if (Number.isFinite(point.percentile_10)) {
          lowerOverlayPoints.push({ x: timestamp, y: point.percentile_10 as number });
        }
      });

      if (meanOverlayPoints.length) {
        const meanPoints = downsampleSeries(meanOverlayPoints, MAX_FORECAST_LINE_POINTS);
        overlays.push({
          id: "forecast-mean",
          label: "Forecast mean",
          data: meanPoints,
          color: "rgba(251, 169, 76, 0.95)",
          strokeWidth: 2.5,
          borderDash: [6, 4],
          tension: 0,
          pointRadius: 0,
          clipToWindow: false,
        });
      }

      if (upperOverlayPoints.length) {
        const upperPoints = downsampleSeries(upperOverlayPoints, MAX_FORECAST_LINE_POINTS);
        overlays.push({
          id: "forecast-upper",
          label: "90th percentile",
          data: upperPoints,
          color: "rgba(59, 130, 246, 0.8)",
          strokeWidth: 1.5,
          borderDash: [3, 3],
          tension: 0,
          pointRadius: 0,
          clipToWindow: false,
        });
      }

      if (lowerOverlayPoints.length) {
        const lowerPoints = downsampleSeries(lowerOverlayPoints, MAX_FORECAST_LINE_POINTS);
        overlays.push({
          id: "forecast-lower",
          label: "10th percentile",
          data: lowerPoints,
          color: "rgba(239, 68, 68, 0.8)",
          strokeWidth: 1.5,
          borderDash: [3, 3],
          tension: 0,
          pointRadius: 0,
          clipToWindow: false,
        });
      }
    }

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
      .map((overlay) => {
        const shouldClip = overlay.clipToWindow !== false;
        const data = shouldClip ? clipHistoricalPoints(overlay.data) : overlay.data;
        return {
          ...overlay,
          data,
        };
      })
      .filter((overlay) => overlay.data.length);

    const filteredMarkers = markers
      .map((marker) => ({
        ...marker,
        points: clipStrategyPoints(marker.points),
      }))
      .filter((marker) => marker.points.length);

    return { technicalOverlays: filteredOverlays, eventMarkers: filteredMarkers };
  }, [
    activeCalculatorId,
    combinedSeries,
    dipThresholdString,
    dcaSimulation,
    projectionStartTimestamp,
    displayWindowStart,
    forecastProjection,
  ]);

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
    setPriceHistoryError(null);
    setIsPriceHistoryLoading(true);
    setPriceHistory([]);
    setForecastProjection([]);
    setProjectionStartTimestamp(0);
    setDcaSimulation(null);

    const tokenFromState = typeof currentState.token === "string" ? currentState.token.trim() : "";
    const explicitTokenId =
      typeof currentState.tokenId === "string" && currentState.tokenId.trim()
        ? currentState.tokenId.trim()
        : undefined;

    let simulationOverlay: StrategyOverlay | null = null;

    try {
      const coinId =
        explicitTokenId ?? (tokenFromState ? await searchCoinGeckoAssetId(tokenFromState) : null);
      if (!coinId) {
        throw new Error("Unable to resolve a CoinGecko ID for the selected token.");
      }

      const forecastDuration = resolveDurationToForecast(durationInput);
      const forecastParams = {
        asset_id: coinId,
        forecast_type: "long",
        duration: forecastDuration,
        include_chart: true,
        vs_currency: "usd",
      };

      const { prompt, options } = activeDefinition.getRequestConfig(
        currentState as any,
        undefined,
        { forecastParams },
      );
      const refId = ensureNovaRefId("calculator");
      const { reply } = await requestNova(prompt, options, { refId });

      const {
        insight: parsedInsight,
        dataset: parsedDataset,
        fallbackSummary: parsedFallbackSummary,
        fallbackLines: parsedFallbackLines,
        strategyOverlays: parsedStrategyOverlays,
        chart: parsedChart,
      } = activeDefinition.parseReply(reply);

      const normalizedChart = parsedChart ?? null;

      const historicalFromChart = normalizedChart?.historical_data ?? [];
      setPriceHistory(historicalFromChart);

      const projectionFromChart = normalizedChart?.projection ?? [];
      setForecastProjection(projectionFromChart);
      const projectionStart =
        projectionFromChart.length && projectionFromChart[0]?.timestamp
          ? new Date(projectionFromChart[0].timestamp).getTime()
          : 0;
      setProjectionStartTimestamp(Number.isFinite(projectionStart) ? projectionStart : 0);

      let trendSimulation: TrendFollowingSimulation | null = null;

      if (activeCalculatorId === "trend-following" && normalizedChart) {
        const maPeriodValue = Number((currentState as Record<string, unknown>).maPeriod ?? 50);
        const initialCapitalValue = Number((currentState as Record<string, unknown>).initialCapital ?? 10000);

        if (Number.isFinite(maPeriodValue) && Number.isFinite(initialCapitalValue)) {
          trendSimulation = simulateTrendFollowingStrategy({
            chartProjection: normalizedChart,
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
            setStrategyOverlays([simulationOverlay]);
          } else {
            setStrategyOverlays([]);
          }
        } else {
          setStrategyOverlays([]);
        }
      }

      if (activeCalculatorId === "dca" && projectionFromChart.length) {
        const amountValue = Number((currentState as Record<string, unknown>).amount ?? 0);
        const intervalValue = typeof currentState.interval === "string" ? currentState.interval : "bi-weekly";
        const durationValue = typeof currentState.duration === "string" ? currentState.duration : "6 months";
        const intervalDays = resolveIntervalToDays(intervalValue);
        const durationMonths = resolveDurationToMonths(durationValue);

        if (Number.isFinite(amountValue) && amountValue > 0) {
          const projectionSeries = projectionFromChart
            .map((point) => {
              const ts = new Date(point.timestamp).getTime();
              if (!Number.isFinite(ts) || !Number.isFinite(point.mean)) {
                return null;
              }
              return {
                timestamp: ts,
                price: point.mean,
                date: point.timestamp.slice(0, 10),
              };
            })
            .filter((entry): entry is { timestamp: number; price: number; date: string } => Boolean(entry));

          const simulation = simulateDcaStrategy({
            projectionSeries,
            amountPerContribution: amountValue,
            intervalDays,
            durationMonths,
          });
          setDcaSimulation(simulation);
        } else {
          setDcaSimulation(null);
        }
      } else {
        setDcaSimulation(null);
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
      setPriceHistoryError(message);
      setNovaDataset([]);
      setInsight(null);
      setFallbackLines([]);
      setStrategyOverlays(simulationOverlay ? [simulationOverlay] : []);
      setDcaSimulation(null);
      setSummaryMessage("Nova couldn't complete this request. Please adjust your inputs and try again.");
    } finally {
      setIsPriceHistoryLoading(false);
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
      setPriceHistoryError(null);
      setIsPriceHistoryLoading(false);
      setForecastProjection([]);
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
    setPriceHistoryError(null);
    setIsPriceHistoryLoading(false);
    setForecastProjection([]);
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

  const CalculatorFormComponent = activeDefinition?.Form ?? null;
  const priceTrajectoryPanel = (
    <PriceTrajectoryPanel
      dataset={displayDataset}
      isLoading={isPriceHistoryLoading}
      seriesLabel={seriesLabel}
      technicalOverlays={technicalOverlays}
      eventMarkers={combinedEventMarkers}
      loadingMessage="Fetching the forecast and chart…"
      emptyMessage={priceHistoryError ?? "Run the projection to visualize the forecasted path."}
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
