"use client";

import type { FormEvent } from "react";
import { useMemo, useRef, useState } from "react";

import { AdSlot } from "@/components/ads/AdSlot";
import { calculatorDefinitions, findCalculatorDefinition } from "@/components/calculators";
import { ADSENSE_SLOTS } from "@/lib/adsense";
import type {
  CalculatorInsight,
  ChartProjectionData,
  CoinGeckoCandle,
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
import { simulateBuyTheDipStrategy, type BuyTheDipSimulation } from "@/components/calculators/buy-the-dip/simulator";
import { SummaryPanel } from "@/components/calculators/workspace/SummaryPanel";
import { Button } from "@/components/ui/button";
import { clearNovaHistory, requestNova } from "@/lib/nova-client";
import { ensureNovaRefId, resetNovaRefId } from "@/lib/nova-session";
import { searchAssets, getMarketChart } from "@/lib/coingecko-client";
import {
  buildDipTriggerSeries,
  buildMovingAverageSeries,
  buildSeriesFromCandles,
  type TimeSeriesValuePoint,
} from "@/components/calculators/workspace/technical-indicators";
import { simulateDcaStrategy, type DcaSimulation } from "@/components/calculators/dca/simulator";
import { normalizeTrendMaPeriodValue } from "@/components/calculators/trend-following/settings";
import { parseTrendFollowingReply } from "@/components/calculators/trend-following/parser";
import { formatSummaryLines } from "@/components/calculators/utils/summary";
import {
  FORECAST_DURATION_MAP,
  requestLongTermForecast,
  type ForecastDurationKey,
  type ForecastProjectionPoint,
  type ForecastSamplePath,
} from "@/lib/nova-forecast";

const defaultCalculatorId = calculatorDefinitions[0]?.id ?? "";
const defaultDefinition = defaultCalculatorId ? findCalculatorDefinition<any>(defaultCalculatorId) : undefined;

const defaultSummary =
  defaultDefinition?.initialSummary ?? "Run a projection to see Nova’s perspective on this plan.";

const PRICE_HISTORY_CACHE_TTL_MS = 1000 * 60 * 2;
const DISPLAY_WINDOW_MONTHS = 3;
const DEFAULT_PROJECTION_MONTHS = 6;
const DURATION_TO_MONTHS: Record<string, number> = {
  "1 month": 1,
  "3 months": 3,
  "6 months": 6,
  "1 year": 12,
};

const DEFAULT_FORECAST_DURATION: ForecastDurationKey = "six_months";

const INTERVAL_TO_DAYS: Record<string, number> = {
  weekly: 7,
  "bi-weekly": 14,
  monthly: 30,
};

function resolveBooleanEnv(value?: string): boolean {
  if (typeof value !== "string") {
    return false;
  }
  return value.trim().toLowerCase() === "true";
}

const CALCULATOR_NOVA_DISABLED = resolveBooleanEnv(
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_DISABLE_CALCULATOR_NOVA : undefined,
);

type ForecastScenario = "likely" | "bearish" | "bullish";

type ForecastSampleCandles = Record<ForecastScenario, CoinGeckoCandle[]>;
type ForecastScenarioSimulations = Record<ForecastScenario, DcaSimulation | TrendFollowingSimulation | BuyTheDipSimulation | null>;
type ScenarioCandlesByCalculator = Record<string, ForecastSampleCandles>;
type ScenarioSimulationsByCalculator = Record<string, ForecastScenarioSimulations>;

const FORECAST_SCENARIO_LABELS: Record<ForecastScenario, string> = {
  likely: "Likely",
  bearish: "Bearish",
  bullish: "Bullish",
};

const FORECAST_SCENARIO_COLORS: Record<ForecastScenario, string> = {
  likely: "#60A5FA",
  bearish: "#F87171",
  bullish: "#22C55E",
};

const SCENARIO_STRATEGY_COLOR = "#FACC15"; // amber

const FORECAST_SCENARIO_KEYS: ForecastScenario[] = ["likely", "bearish", "bullish"];

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

function createEmptySampleCandles(): ForecastSampleCandles {
  return {
    likely: [],
    bearish: [],
    bullish: [],
  };
}

function createEmptyScenarioSimulations(): ForecastScenarioSimulations {
  return {
    likely: null,
    bearish: null,
    bullish: null,
  };
}

function isPointBasedSimulation(
  simulation: DcaSimulation | TrendFollowingSimulation | BuyTheDipSimulation | null,
): simulation is DcaSimulation | BuyTheDipSimulation {
  return Boolean(simulation && "points" in simulation && Array.isArray(simulation.points));
}

function isTrendFollowingSimulation(
  simulation: DcaSimulation | TrendFollowingSimulation | BuyTheDipSimulation | null,
): simulation is TrendFollowingSimulation {
  return Boolean(simulation && "crossovers" in simulation && Array.isArray(simulation.crossovers));
}

function normalizeSampleScenario(label?: string): ForecastScenario | null {
  if (!label) {
    return null;
  }
  const normalized = label.trim().toLowerCase();
  if (normalized.includes("bear")) {
    return "bearish";
  }
  if (normalized.includes("bull")) {
    return "bullish";
  }
  if (normalized.includes("likely") || normalized.includes("mean")) {
    return "likely";
  }
  return null;
}

function resolveForecastDuration(duration?: unknown): ForecastDurationKey {
  if (typeof duration !== "string") {
    return DEFAULT_FORECAST_DURATION;
  }

  const normalized = duration.trim().toLowerCase();
  return FORECAST_DURATION_MAP[normalized] ?? DEFAULT_FORECAST_DURATION;
}

type ProjectionTrajectoryPoint = {
  x: number;
  y: number;
};

type ForecastTrajectorySet = {
  mean: ProjectionTrajectoryPoint[];
  percentile10: ProjectionTrajectoryPoint[];
  percentile90: ProjectionTrajectoryPoint[];
};

function buildForecastTrajectory(
  projectionPoints: ForecastProjectionPoint[] | undefined,
  history: CoinGeckoCandle[],
): ForecastTrajectorySet {
  if (!projectionPoints?.length) {
    return { mean: [], percentile10: [], percentile90: [] };
  }

  const series: ForecastTrajectorySet = {
    mean: [],
    percentile10: [],
    percentile90: [],
  };

  projectionPoints.forEach((point) => {
    const timestamp = new Date(point.timestamp).getTime();
    if (!Number.isFinite(timestamp)) {
      return;
    }

    const meanValue =
      typeof point.mean === "number"
        ? point.mean
        : typeof point.percentile_50 === "number"
          ? point.percentile_50
          : typeof point.percentile_10 === "number" && typeof point.percentile_90 === "number"
            ? (point.percentile_10 + point.percentile_90) / 2
            : null;
    const p10Value = typeof point.percentile_10 === "number" ? point.percentile_10 : null;
    const p90Value = typeof point.percentile_90 === "number" ? point.percentile_90 : null;

    if (Number.isFinite(meanValue)) {
      series.mean.push({ x: timestamp, y: meanValue as number });
    }
    if (Number.isFinite(p10Value)) {
      series.percentile10.push({ x: timestamp, y: p10Value as number });
    }
    if (Number.isFinite(p90Value)) {
      series.percentile90.push({ x: timestamp, y: p90Value as number });
    }
  });

  const sortSeries = (points: ProjectionTrajectoryPoint[]) => points.sort((a, b) => a.x - b.x);
  sortSeries(series.mean);
  sortSeries(series.percentile10);
  sortSeries(series.percentile90);

  const lastHistorical = history[history.length - 1];
  if (lastHistorical) {
    const historicalTimestamp = new Date(lastHistorical.date).getTime();
    if (Number.isFinite(historicalTimestamp) && Number.isFinite(lastHistorical.close)) {
      const prepend = (points: ProjectionTrajectoryPoint[]) => {
        if (!points.length) {
          return;
        }
        if (points[0].x > historicalTimestamp) {
          points.unshift({ x: historicalTimestamp, y: lastHistorical.close });
        } else if (points[0].x === historicalTimestamp) {
          points[0] = { x: historicalTimestamp, y: lastHistorical.close };
        }
      };

      prepend(series.mean);
      prepend(series.percentile10);
      prepend(series.percentile90);
    }
  }

  return series;
}

function buildSampleCandlesFromPaths(
  samplePaths: ForecastSamplePath[] | undefined,
  projectionSeries: { timestamp: number; price: number }[],
  history: CoinGeckoCandle[],
): ForecastSampleCandles {
  const result = createEmptySampleCandles();
  if (!samplePaths?.length || !projectionSeries.length || !history.length) {
    return result;
  }

  const lastHistoricalClose = history[history.length - 1]?.close ?? projectionSeries[0]?.price ?? 0;

  samplePaths.forEach((path) => {
    const key = normalizeSampleScenario(path.label);
    if (!key) {
      return;
    }

    const points = Array.isArray(path.points) ? path.points : [];
    if (!points.length) {
      return;
    }

    const candles: CoinGeckoCandle[] = [];
    let previousPrice = lastHistoricalClose;
    const limit = Math.min(points.length, projectionSeries.length);
    for (let index = 0; index < limit; index += 1) {
      const target = projectionSeries[index];
      const nextPrice = points[index];
      if (!Number.isFinite(nextPrice) || !Number.isFinite(target.timestamp)) {
        continue;
      }
      const open = Number.isFinite(previousPrice) ? previousPrice : nextPrice;
      const close = nextPrice;
      const high = Math.max(open, close);
      const low = Math.min(open, close);
      candles.push({
        date: new Date(target.timestamp).toISOString(),
        open,
        high,
        low,
        close,
      });
      previousPrice = close;
    }

    result[key] = candles;
  });

  return result;
}

function buildProjectionSeriesFromCandles(candles: CoinGeckoCandle[]) {
  return candles.map((candle) => ({
    timestamp: new Date(candle.date).getTime(),
    price: candle.close,
    date: candle.date,
  }));
}

function buildDisplayWindow(history: CoinGeckoCandle[]): CoinGeckoCandle[] {
  if (!history.length) {
    return history;
  }

  const latestCandle = history[history.length - 1];
  const latestDate = new Date(latestCandle.date);
  const windowStartDate = new Date(latestDate);
  windowStartDate.setMonth(windowStartDate.getMonth() - DISPLAY_WINDOW_MONTHS);
  const windowStartTimestamp = windowStartDate.getTime();

  const filtered = history.filter(
    (candle) => new Date(candle.date).getTime() >= windowStartTimestamp,
  );

  return filtered.length ? filtered : history;
}

function buildChartProjectionPayload(
  history: CoinGeckoCandle[],
  asset: string,
  projectionOverride?: ProjectionTrajectoryPoint[] | null,
  projectionHorizonOverride?: number,
): ChartProjectionData {
  const windowedHistory = buildDisplayWindow(history);
  const projection =
    projectionOverride?.length && projectionOverride.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
      ? projectionOverride
      : [];

  const latestCandle = history[history.length - 1];
  const metadata = {
    asset: asset || "asset",
    as_of: latestCandle?.date ?? new Date().toISOString().slice(0, 10),
    projection_horizon_months: projectionHorizonOverride ?? DEFAULT_PROJECTION_MONTHS,
  };

  return {
    historical_data: windowedHistory.length ? windowedHistory : history,
    projection,
    metadata,
  };
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
  const priceHistoryRequestRef = useRef(0);
  const priceHistoryCacheRef = useRef(
    new Map<
      string,
      {
        data: CoinGeckoCandle[];
        fetchedAt: number;
      }
    >(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [dcaSimulation, setDcaSimulation] = useState<DcaSimulation | null>(null);
  const [projectionStartTimestamp, setProjectionStartTimestamp] = useState(0);
  const [forecastPercentileOverlays, setForecastPercentileOverlays] = useState<PriceTrajectoryOverlay[]>([]);
  const [scenarioSampleCandlesMap, setScenarioSampleCandlesMap] = useState<ScenarioCandlesByCalculator>({});
  const [scenarioSimulationsMap, setScenarioSimulationsMap] = useState<ScenarioSimulationsByCalculator>({});
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [hasProjectionReady, setHasProjectionReady] = useState(false);

  const activeDefinition = findCalculatorDefinition<any>(activeCalculatorId);

  const formState = (calculatorStates[activeCalculatorId] ??
    activeDefinition?.getInitialState?.() ??
    {}) as Record<string, unknown>;

  const activeScenario: ForecastScenario =
    activeCalculatorId === "dca" && typeof formState.scenario === "string"
      ? (formState.scenario as ForecastScenario)
      : typeof formState.scenario === "string"
        ? (formState.scenario as ForecastScenario)
        : "likely";

  const activeScenarioCandles =
    scenarioSampleCandlesMap[activeCalculatorId]?.[activeScenario] ?? createEmptySampleCandles()[activeScenario];
  const activeScenarioSimulation =
    scenarioSimulationsMap[activeCalculatorId]?.[activeScenario] ?? createEmptyScenarioSimulations()[activeScenario];

  const seriesLabel =
    (activeDefinition?.getSeriesLabel ? activeDefinition.getSeriesLabel(formState as any) : undefined) ?? "Modeled price";

  const dipThresholdString = String((formState as Record<string, unknown>).dipThreshold ?? "");
  const durationInput = typeof formState.duration === "string" ? formState.duration : undefined;
  const trendMaPeriodInput = (formState as Record<string, unknown>).maPeriod;

  const trendMaPeriodValue = useMemo(() => {
    if (activeCalculatorId !== "trend-following") {
      return null;
    }
    return normalizeTrendMaPeriodValue(trendMaPeriodInput, durationInput);
  }, [activeCalculatorId, trendMaPeriodInput, durationInput]);
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

  const activeScenarioSeries = useMemo<TimeSeriesValuePoint[]>(() => {
    if (!activeScenarioCandles.length) {
      return [];
    }
    return buildSeriesFromCandles(activeScenarioCandles);
  }, [activeScenarioCandles]);

  const { technicalOverlays, eventMarkers } = useMemo(() => {
    if (!historicalSeries.length) {
      return { technicalOverlays: [], eventMarkers: [] };
    }

    const overlays: PriceTrajectoryOverlay[] = [];
    const markers: PriceTrajectoryEventMarker[] = [];

    if (["dca", "trend-following", "buy-the-dip"].includes(activeCalculatorId)) {
      if (forecastPercentileOverlays.length) {
        overlays.push(...forecastPercentileOverlays);
      }
      const scenarioSimulation = activeScenarioSimulation as DcaSimulation | TrendFollowingSimulation | BuyTheDipSimulation | null;
      const scenarioStrategyLabel =
        activeCalculatorId === "trend-following"
          ? "MA crossover buys"
          : activeCalculatorId === "buy-the-dip"
            ? "Buy dip triggers"
            : "Scheduled buys";

      const strategyEntries: {
        point: { x: number; y: number };
        meta: {
          action?: string;
          amount?: number;
          quantity?: number;
          price: number;
          date: string;
          description?: string;
        };
      }[] = [];

      if (isPointBasedSimulation(scenarioSimulation)) {
        scenarioSimulation.points.forEach((point) => {
          const timestamp = new Date(point.date).getTime();
          if (!Number.isFinite(timestamp) || !Number.isFinite(point.price)) {
            return;
          }
          strategyEntries.push({
            point: { x: timestamp, y: point.price },
            meta: {
              action: `Buy $${point.amount.toFixed(2)}`,
              amount: point.amount,
              quantity: point.quantity,
              price: point.price,
              date: point.date,
            },
          });
        });
      } else if (isTrendFollowingSimulation(scenarioSimulation)) {
        scenarioSimulation.crossovers.forEach((crossover) => {
          const timestamp = new Date(crossover.date).getTime();
          if (!Number.isFinite(timestamp) || !Number.isFinite(crossover.price)) {
            return;
          }
          const action =
            crossover.signal === "enter"
              ? "Enter long (price above MA)"
              : "Exit to cash (price below MA)";
          strategyEntries.push({
            point: { x: timestamp, y: crossover.price },
            meta: {
              action,
              description: "Moving average crossover",
              price: crossover.price,
              date: crossover.date,
            },
          });
        });
      }

      if (strategyEntries.length) {
        overlays.push({
          id: "scenario-strategy-line",
          label: scenarioStrategyLabel,
          data: strategyEntries.map((entry) => entry.point),
          color: SCENARIO_STRATEGY_COLOR,
          strokeWidth: 2,
          borderDash: [2, 4],
          pointRadius: 0,
          order: 2000,
        });
        markers.push({
          id: "scenario-strategy-points",
          label: scenarioStrategyLabel,
          points: strategyEntries.map((entry) => ({
            x: entry.point.x,
            y: entry.point.y,
            meta: entry.meta,
          })),
          backgroundColor: SCENARIO_STRATEGY_COLOR,
          borderColor: SCENARIO_STRATEGY_COLOR,
          radius: 4,
        });
      }
    }

    if (activeCalculatorId === "trend-following") {
      const selectedMaPeriod =
        typeof trendMaPeriodValue === "number" && Number.isFinite(trendMaPeriodValue)
          ? trendMaPeriodValue
          : null;
      if (selectedMaPeriod && selectedMaPeriod > 1) {
        const maSource = activeScenarioSeries.length
          ? [...historicalSeries, ...activeScenarioSeries]
          : historicalSeries;
        const maSeries = buildMovingAverageSeries(maSource, selectedMaPeriod);
        if (maSeries.length) {
          overlays.push({
            id: "trend-selected-ma",
            label: `${selectedMaPeriod}-day MA`,
            data: maSeries,
            color: "rgba(96, 165, 250, 0.95)",
            borderDash: [6, 4],
            strokeWidth: 2,
          });
        }
      }
    }

    const clipHistoricalPoints = <T extends { x: number }>(points: T[]) => {
      const start = displayWindowStart;
      return points.filter((point) => point.x >= start);
    };

    const clipStrategyPoints = <T extends { x: number }>(points: T[]) =>
      projectionStartTimestamp ? points.filter((point) => point.x >= projectionStartTimestamp) : points;

    const filteredOverlays = overlays
      .map((overlay) => {
        const clippedData =
          overlay.id === "scenario-strategy-line"
            ? clipStrategyPoints(clipHistoricalPoints(overlay.data))
            : clipHistoricalPoints(overlay.data);
        return {
          ...overlay,
          data: clippedData,
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
    projectionStartTimestamp,
    displayWindowStart,
    forecastPercentileOverlays,
    activeScenarioSimulation,
    trendMaPeriodValue,
    historicalSeries,
    activeScenarioSeries,
  ]);


  const combinedEventMarkers = useMemo(() => [...eventMarkers], [eventMarkers]);

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
    setPriceHistoryError(null);
    setIsPriceHistoryLoading(true);
    setPriceHistory([]);
    setProjectionStartTimestamp(0);
    setDcaSimulation(null);
    setHasProjectionReady(false);
    setIsInsightsLoading(false);
    setForecastPercentileOverlays([]);
    setScenarioSampleCandlesMap((previous) => ({
      ...previous,
      [activeCalculatorId]: createEmptySampleCandles(),
    }));
    setScenarioSimulationsMap((previous) => ({
      ...previous,
      [activeCalculatorId]: createEmptyScenarioSimulations(),
    }));

    const tokenFromState = typeof currentState.token === "string" ? currentState.token.trim() : "";
    const explicitTokenId =
      typeof currentState.tokenId === "string" && currentState.tokenId.trim()
        ? currentState.tokenId.trim()
        : undefined;

    const historyRequestId = priceHistoryRequestRef.current + 1;
    priceHistoryRequestRef.current = historyRequestId;

    let chartProjection: ChartProjectionData | undefined;
    let projectionSeries: { timestamp: number; price: number; date: string }[] = [];
    let trendSimulation: TrendFollowingSimulation | null = null;
    let forecastTrajectory: ProjectionTrajectoryPoint[] | null = null;
    let projectionMonthsOverride: number | undefined;
    let dcaResolvedDurationMonths: number | null = null;
    let resolvedHistory: CoinGeckoCandle[] = [];
    let forecastSamplePaths: ForecastSamplePath[] = [];
    let dcaTotalBudgetValue = 0;
    let dcaIntervalDaysValue = 0;
    let dcaDurationMonthsValue = 0;
    let trendInitialCapitalValue = 0;
    let trendMaPeriodValue = 50;
    let buyBudgetValue = 0;
    let buyDipThresholdValue = 0;

    try {
      const coinId =
        explicitTokenId ?? (tokenFromState ? await searchCoinGeckoAssetId(tokenFromState) : null);
      if (!coinId) {
        throw new Error("Unable to resolve a CoinGecko ID for the selected token.");
      }

      const cacheEntry = priceHistoryCacheRef.current.get(coinId);
      const now = Date.now();
      let history: CoinGeckoCandle[];

      if (cacheEntry && now - cacheEntry.fetchedAt < PRICE_HISTORY_CACHE_TTL_MS) {
        history = cacheEntry.data;
      } else {
        history = await getMarketChart(coinId, "365", "usd");
        priceHistoryCacheRef.current.set(coinId, { data: history, fetchedAt: now });
      }

      if (priceHistoryRequestRef.current !== historyRequestId) {
        return;
      }

      if (!history.length) {
        throw new Error("CoinGecko returned no price history for this token.");
      }

      resolvedHistory = history;
      const assetLabel = tokenFromState || coinId;

      if (["dca", "trend-following", "buy-the-dip"].includes(activeCalculatorId)) {
        const rawDuration = typeof currentState.duration === "string" ? currentState.duration : "6 months";
        const resolvedDurationMonths = resolveDurationToMonths(rawDuration);
        projectionMonthsOverride = resolvedDurationMonths;
        const forecastDuration = resolveForecastDuration(rawDuration);
        console.log("[Forecast] Fetching paths", {
          calculator: activeCalculatorId,
          token: assetLabel,
          duration: forecastDuration,
        });
        const forecastPayload = await requestLongTermForecast({
          assetId: coinId,
          duration: forecastDuration,
          includeChart: true,
        });
        forecastSamplePaths = forecastPayload.forecast?.value?.sample_paths ?? [];
        const trajectorySet = buildForecastTrajectory(forecastPayload.chart?.projection, history);
        forecastTrajectory = trajectorySet.mean.length ? trajectorySet.mean : null;
        const overlays: PriceTrajectoryOverlay[] = [];
        if (trajectorySet.mean.length) {
          overlays.push({
            id: "forecast-mean",
            label: "Mean projection",
            data: trajectorySet.mean.map((point) => ({ x: point.x, y: point.y })),
            color: "#38BDF8",
            strokeWidth: 2,
            borderDash: [6, 4],
            pointRadius: 0,
            order: 5,
          });
        }
        if (trajectorySet.percentile10.length) {
          overlays.push({
            id: "forecast-p10",
            label: "Bearish (p10)",
            data: trajectorySet.percentile10.map((point) => ({ x: point.x, y: point.y })),
            color: "rgba(248, 113, 113, 0.9)",
            backgroundColor: "rgba(248, 113, 113, 0.15)",
            strokeWidth: 2,
            borderDash: [4, 4],
          });
        }
        if (trajectorySet.percentile90.length) {
          overlays.push({
            id: "forecast-p90",
            label: "Bullish (p90)",
            data: trajectorySet.percentile90.map((point) => ({ x: point.x, y: point.y })),
            color: "rgba(34, 197, 94, 0.95)",
            backgroundColor: "rgba(34, 197, 94, 0.15)",
            strokeWidth: 2,
            borderDash: [4, 4],
          });
        }
        setForecastPercentileOverlays(overlays);

        const trendDurationValue = typeof currentState.duration === "string" ? currentState.duration : undefined;

        if (activeCalculatorId === "dca") {
          const rawAmount = Number((currentState as Record<string, unknown>).amount ?? 0);
          const intervalValue = typeof currentState.interval === "string" ? currentState.interval : "bi-weekly";
          const intervalDays = resolveIntervalToDays(intervalValue);
          const durationMonths = resolvedDurationMonths;
          dcaTotalBudgetValue = rawAmount;
          dcaIntervalDaysValue = intervalDays;
          dcaDurationMonthsValue = durationMonths;
        } else if (activeCalculatorId === "trend-following") {
          trendInitialCapitalValue = Number((currentState as Record<string, unknown>).initialCapital ?? 0);
          trendMaPeriodValue = normalizeTrendMaPeriodValue(
            (currentState as Record<string, unknown>).maPeriod,
            trendDurationValue,
          );
        } else if (activeCalculatorId === "buy-the-dip") {
          buyBudgetValue = Number((currentState as Record<string, unknown>).budget ?? 0);
          buyDipThresholdValue = Number((currentState as Record<string, unknown>).dipThreshold ?? 0);
        }
      } else {
        projectionMonthsOverride = undefined;
        forecastTrajectory = null;
        setForecastPercentileOverlays([]);
        setScenarioSampleCandlesMap((previous) => ({
          ...previous,
          [activeCalculatorId]: createEmptySampleCandles(),
        }));
        setScenarioSimulationsMap((previous) => ({
          ...previous,
          [activeCalculatorId]: createEmptyScenarioSimulations(),
        }));
      }

      chartProjection = buildChartProjectionPayload(
        history,
        assetLabel,
        forecastTrajectory,
        projectionMonthsOverride,
      );
      projectionSeries = chartProjection.projection.map((point) => ({
        timestamp: point.x,
        price: point.y,
        date: new Date(point.x).toISOString().slice(0, 10),
      }));
      setProjectionStartTimestamp(projectionSeries[0]?.timestamp ?? 0);
      if (["dca", "trend-following", "buy-the-dip"].includes(activeCalculatorId)) {
        const sampleCandles = buildSampleCandlesFromPaths(forecastSamplePaths, projectionSeries, resolvedHistory);
        setScenarioSampleCandlesMap((previous) => ({
          ...previous,
          [activeCalculatorId]: sampleCandles,
        }));

        const scenarioSimulations = createEmptyScenarioSimulations();
        FORECAST_SCENARIO_KEYS.forEach((scenario) => {
          const candles = sampleCandles[scenario];
          if (!candles.length) {
            return;
          }
          const scenarioSeries = buildProjectionSeriesFromCandles(candles);
          if (!scenarioSeries.length) {
            return;
          }

          if (activeCalculatorId === "dca") {
            const amountValid =
              Number.isFinite(dcaTotalBudgetValue) &&
              dcaTotalBudgetValue > 0 &&
              Number.isFinite(dcaIntervalDaysValue) &&
              dcaIntervalDaysValue > 0 &&
              Number.isFinite(dcaDurationMonthsValue) &&
              dcaDurationMonthsValue > 0;
            if (amountValid) {
              scenarioSimulations[scenario] = simulateDcaStrategy({
                projectionSeries: scenarioSeries,
                totalBudget: dcaTotalBudgetValue,
                intervalDays: dcaIntervalDaysValue,
                durationMonths: dcaDurationMonthsValue,
              });
            }
          } else if (activeCalculatorId === "trend-following") {
            if (Number.isFinite(trendInitialCapitalValue) && trendInitialCapitalValue > 0) {
              const projectionTrajectory = scenarioSeries.map((point) => ({ x: point.timestamp, y: point.price }));
              const scenarioChartProjection: ChartProjectionData = {
                historical_data: resolvedHistory,
                projection: projectionTrajectory,
                metadata: {
                  asset: assetLabel,
                  as_of: resolvedHistory.at(-1)?.date ?? new Date().toISOString().slice(0, 10),
                  projection_horizon_months: projectionMonthsOverride ?? DEFAULT_PROJECTION_MONTHS,
                },
              };
              scenarioSimulations[scenario] = simulateTrendFollowingStrategy({
                chartProjection: scenarioChartProjection,
                initialCapital: trendInitialCapitalValue,
                maPeriod: trendMaPeriodValue,
              });
            }
          } else if (activeCalculatorId === "buy-the-dip") {
            if (Number.isFinite(buyBudgetValue) && buyBudgetValue > 0 && Number.isFinite(buyDipThresholdValue)) {
              scenarioSimulations[scenario] = simulateBuyTheDipStrategy({
                projectionCandles: candles,
                dipThresholdPct: buyDipThresholdValue,
                totalBudget: buyBudgetValue,
              });
            }
          }
        });

        setScenarioSimulationsMap((previous) => ({
          ...previous,
          [activeCalculatorId]: scenarioSimulations,
        }));
      } else {
        setScenarioSampleCandlesMap((previous) => ({
          ...previous,
          [activeCalculatorId]: createEmptySampleCandles(),
        }));
        setScenarioSimulationsMap((previous) => ({
          ...previous,
          [activeCalculatorId]: createEmptyScenarioSimulations(),
        }));
      }

      setPriceHistory(resolvedHistory);
      setIsPriceHistoryLoading(false);

      if (activeCalculatorId === "trend-following" && chartProjection) {
        const maPeriodValue = normalizeTrendMaPeriodValue(
          (currentState as Record<string, unknown>).maPeriod,
          typeof currentState.duration === "string" ? currentState.duration : undefined,
        );
        const initialCapitalValue = Number((currentState as Record<string, unknown>).initialCapital ?? 10000);

        if (Number.isFinite(maPeriodValue) && Number.isFinite(initialCapitalValue)) {
          trendSimulation = simulateTrendFollowingStrategy({
            chartProjection,
            maPeriod: maPeriodValue,
            initialCapital: initialCapitalValue,
          });
        }
      }

      if (activeCalculatorId === "dca" && chartProjection) {
        if (Number.isFinite(dcaTotalBudgetValue) && dcaTotalBudgetValue > 0) {
          const simulation = simulateDcaStrategy({
            projectionSeries,
            totalBudget: dcaTotalBudgetValue,
            intervalDays: dcaIntervalDaysValue,
            durationMonths: dcaDurationMonthsValue,
          });
          setDcaSimulation(simulation);
        } else {
          setDcaSimulation(null);
        }
      } else {
        setDcaSimulation(null);
      }

      setSummaryMessage("Projection updated. Generate insights to see Nova’s take on this scenario.");
      setFallbackLines([]);
      setInsight(null);
      setHasProjectionReady(true);
      setIsLoading(false);
      return;
    } catch (historyError) {
      if (priceHistoryRequestRef.current !== historyRequestId) {
        return;
      }

      const message =
        historyError instanceof Error
          ? historyError.message
          : "Unable to load price history from CoinGecko.";
      setPriceHistoryError(message);
      setError(message);
      setForecastPercentileOverlays([]);
      setScenarioSampleCandlesMap((previous) => ({
        ...previous,
        [activeCalculatorId]: createEmptySampleCandles(),
      }));
      setScenarioSimulationsMap((previous) => ({
        ...previous,
        [activeCalculatorId]: createEmptyScenarioSimulations(),
      }));
      setIsPriceHistoryLoading(false);
      setHasProjectionReady(false);
      setIsLoading(false);
      return;
    }
  };

  const handleGenerateInsights = async () => {
    if (!activeDefinition || !hasProjectionReady) {
      return;
    }
    if (CALCULATOR_NOVA_DISABLED) {
      setError("Nova insights are disabled in this environment.");
      return;
    }
    if (!priceHistory.length || !activeScenarioCandles.length) {
      setError("Run the projection to generate the scenario path before requesting insights.");
      return;
    }

    const scenarioSeries = buildProjectionSeriesFromCandles(activeScenarioCandles);
    if (!scenarioSeries.length) {
      setError("Unable to generate the scenario path for this projection.");
      return;
    }

    const projectionTrajectory = scenarioSeries.map((point) => ({
      x: point.timestamp,
      y: point.price,
    }));
    const durationString = typeof formState.duration === "string" ? formState.duration : undefined;
    const projectionMonths = resolveDurationToMonths(durationString);
    const assetLabel =
      typeof formState.token === "string" && formState.token.trim().length
        ? formState.token.trim()
        : "asset";

    const scenarioChartProjection = buildChartProjectionPayload(
      priceHistory,
      assetLabel,
      projectionTrajectory,
      projectionMonths,
    );

    const extras: Record<string, unknown> = {};
    if (activeScenarioSimulation) {
      if (activeCalculatorId === "trend-following") {
        extras.trendSimulation = activeScenarioSimulation;
      } else {
        extras.strategySimulation = activeScenarioSimulation;
      }
    }

    setIsInsightsLoading(true);
    setError(null);
    setSummaryMessage(activeDefinition.pendingSummary ?? "Generating Nova’s latest projection...");

    try {
      const { prompt, options } = activeDefinition.getRequestConfig(
        formState as any,
        scenarioChartProjection,
        extras,
      );
      const refId = ensureNovaRefId("calculator");
      const { reply } = await requestNova(prompt, options, { refId });

      const {
        insight: parsedInsight,
        dataset: parsedDataset,
        fallbackSummary: parsedFallbackSummary,
        fallbackLines: parsedFallbackLines,
      } = activeDefinition.parseReply(reply);

      const trendResult =
        activeCalculatorId === "trend-following" ? parseTrendFollowingReply(reply) : null;

      setInsight(parsedInsight ?? null);
      setNovaDataset(parsedDataset);

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
      setSummaryMessage("Nova couldn't complete this request. Please adjust your inputs and try again.");
    } finally {
      setIsInsightsLoading(false);
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
      priceHistoryRequestRef.current += 1;
      setNovaDataset([]);
      setPriceHistory([]);
      setPriceHistoryError(null);
      setIsPriceHistoryLoading(false);
      setDcaSimulation(null);
      setProjectionStartTimestamp(0);
      setForecastPercentileOverlays([]);
      setScenarioSampleCandlesMap((previous) => ({
        ...previous,
        [activeCalculatorId]: createEmptySampleCandles(),
      }));
      setScenarioSimulationsMap((previous) => ({
        ...previous,
        [activeCalculatorId]: createEmptyScenarioSimulations(),
      }));
      setInsight(null);
      setFallbackLines([]);
      setIsInsightsLoading(false);
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
    priceHistoryRequestRef.current += 1;
    setPriceHistory([]);
    setPriceHistoryError(null);
    setIsPriceHistoryLoading(false);
    setDcaSimulation(null);
    setProjectionStartTimestamp(0);
    setForecastPercentileOverlays([]);
    setScenarioSampleCandlesMap((previous) => ({
      ...previous,
      [nextId]: createEmptySampleCandles(),
    }));
    setScenarioSimulationsMap((previous) => ({
      ...previous,
      [nextId]: createEmptyScenarioSimulations(),
    }));

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
  const hasScenarioProjection = activeScenarioCandles.length > 0;
  const scenarioProjectionLabel = hasScenarioProjection
    ? `${FORECAST_SCENARIO_LABELS[activeScenario]} path`
    : undefined;
  const scenarioProjectionColor = hasScenarioProjection ? FORECAST_SCENARIO_COLORS[activeScenario] : undefined;
  const canRequestInsights =
    hasProjectionReady &&
    hasScenarioProjection &&
    !isPriceHistoryLoading &&
    !isLoading &&
    !isInsightsLoading;

  const priceTrajectoryPanel = (
    <PriceTrajectoryPanel
      dataset={displayDataset}
      isLoading={isPriceHistoryLoading}
      seriesLabel={seriesLabel}
      technicalOverlays={technicalOverlays}
      eventMarkers={combinedEventMarkers}
      projectionCandles={activeScenarioCandles.length ? activeScenarioCandles : null}
      projectionCandlesLabel={scenarioProjectionLabel}
      projectionCandlesColor={scenarioProjectionColor}
      loadingMessage="Fetching price history from CoinGecko…"
      emptyMessage={
        priceHistoryError ?? "Run the projection to visualize one year of CoinGecko price history."
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
            onRequestInsights={handleGenerateInsights}
            canRequestInsights={canRequestInsights}
            isRequestingInsights={isInsightsLoading}
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
          isLoading={isInsightsLoading && !CALCULATOR_NOVA_DISABLED}
          loadingMessage="Nova is compiling the summary and risk notes for this scenario."
        />
      }
      chartPanel={priceTrajectoryPanel}
      midSlot={
        <AdSlot
          adSlot={ADSENSE_SLOTS.betweenPanelsAndChart}
          format="horizontal"
          minHeight={60}
          label="Mid Section Ad"
        />
      }
      bottomSlot={
        <AdSlot
          adSlot={ADSENSE_SLOTS.belowChart}
          format="horizontal"
          minHeight={90}
          label="Below Chart Ad"
        />
      }
    />
  );
}
