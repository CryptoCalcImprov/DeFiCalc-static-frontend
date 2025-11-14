"use client";

import type { FormEvent } from "react";
import { useMemo, useRef, useState, useCallback } from "react";

import { calculatorDefinitions, findCalculatorDefinition } from "@/components/calculators";
import type {
  CalculatorInsight,
  ChartProjectionData,
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
import {
  estimateDriftAndVolatility,
  generateMonteCarloPath,
  MonteCarloHorizons,
} from "@/lib/monte-carlo";
import type { MonteCarloHorizon, MonteCarloTrajectoryPoint } from "@/lib/monte-carlo";
import { parseTrendFollowingReply } from "@/components/calculators/trend-following/parser";
import { formatSummaryLines } from "@/components/calculators/utils/summary";
import { simulateDcaStrategy, type DcaSimulation } from "@/components/calculators/dca/simulator";

const defaultCalculatorId = calculatorDefinitions[0]?.id ?? "";
const defaultDefinition = defaultCalculatorId ? findCalculatorDefinition<any>(defaultCalculatorId) : undefined;

const defaultSummary =
  defaultDefinition?.initialSummary ?? "Run a projection to see Nova’s perspective on this plan.";

const COINGECKO_API_BASE_URL = "https://api.coingecko.com/api/v3";
const COINGECKO_SEARCH_ENDPOINT =
  process.env.NEXT_PUBLIC_COINGECKO_SEARCH_ENDPOINT ?? `${COINGECKO_API_BASE_URL}/search`;
const PRICE_HISTORY_CACHE_TTL_MS = 1000 * 60 * 2;
const DISPLAY_WINDOW_MONTHS = 3;
const DURATION_TO_MONTE_CARLO_HORIZON: Record<string, MonteCarloHorizon> = {
  "3 months": MonteCarloHorizons.THREE_MONTHS,
  "6 months": MonteCarloHorizons.SIX_MONTHS,
  "1 year": MonteCarloHorizons.ONE_YEAR,
  "2 years": MonteCarloHorizons.TWO_YEARS,
  "3 years": MonteCarloHorizons.THREE_YEARS,
};

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
  horizon: MonteCarloHorizon | undefined,
  asset: string,
): ChartProjectionData {
  const windowedHistory = buildDisplayWindow(history);
  const projectionSource = windowedHistory.length ? windowedHistory : history;
  let projection: MonteCarloTrajectoryPoint[] = [];

  if (projectionSource.length >= 2) {
    const stats = estimateDriftAndVolatility(projectionSource.map((point) => point.close));
    const startCandle = projectionSource[projectionSource.length - 1];
    if (stats && startCandle) {
      const horizonMonths = horizon ?? MonteCarloHorizons.SIX_MONTHS;
      projection = generateMonteCarloPath({
        startPrice: startCandle.close,
        startTimestamp: new Date(startCandle.date).getTime(),
        drift: stats.drift,
        volatility: stats.volatility,
        config: {
          horizonMonths,
          stepDays: 1,
          seed: 13579,
        },
      });
    }
  }

  const latestCandle = history[history.length - 1];
  const metadata = {
    asset: asset || "asset",
    as_of: latestCandle?.date ?? new Date().toISOString().slice(0, 10),
    projection_horizon_months: horizon ?? MonteCarloHorizons.SIX_MONTHS,
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

  const requestUrl = new URL(COINGECKO_SEARCH_ENDPOINT);
  requestUrl.searchParams.set("query", normalizedQuery);

  const response = await fetch(requestUrl);
  if (!response.ok) {
    throw new Error(`CoinGecko search failed (${response.status}).`);
  }

  const payload = (await response.json().catch(() => ({} as Record<string, unknown>))) as Record<
    string,
    unknown
  >;
  const coins = Array.isArray(payload.coins) ? payload.coins : [];

  for (const entry of coins) {
    if (typeof entry !== "object" || entry === null) {
      continue;
    }

    const coinRecord = entry as Record<string, unknown>;
    const idValue = typeof coinRecord.id === "string" ? coinRecord.id.trim() : "";
    if (idValue) {
      return idValue;
    }
  }

  return null;
}

async function fetchCoinGeckoPriceHistory(assetId: string): Promise<CoinGeckoCandle[]> {
  // Use market_chart endpoint for daily data (365 days = daily intervals)
  // OHLC endpoint only provides 4-day intervals for 365 days
  const requestUrl = new URL(`${COINGECKO_API_BASE_URL}/coins/${assetId}/market_chart`);
  requestUrl.searchParams.set("vs_currency", "usd");
  requestUrl.searchParams.set("days", "365");

  const response = await fetch(requestUrl);
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("CoinGecko rate limit exceeded. Please wait a moment and try again.");
    }
    throw new Error(`CoinGecko price history fetch failed (${response.status}).`);
  }

  const payload = (await response.json().catch(() => ({} as Record<string, unknown>))) as Record<
    string,
    unknown
  >;
  const rawPrices = Array.isArray(payload.prices) ? payload.prices : [];
  if (rawPrices.length === 0) {
    return [];
  }

  // Convert daily price data to OHLC candles
  // Since we only have closing prices, we'll create synthetic OHLC:
  // - open = previous day's close (or same as close for first day)
  // - close = current price
  // - high/low estimated based on price movement
  const normalized: CoinGeckoCandle[] = [];
  
  for (let i = 0; i < rawPrices.length; i++) {
    const entry = rawPrices[i];
    if (!Array.isArray(entry) || entry.length < 2) {
      continue;
    }

    const timestamp = Number(entry[0]);
    const close = Number(entry[1]);
    
    if (Number.isNaN(timestamp) || Number.isNaN(close)) {
      continue;
    }

    // Get previous close for open price
    const prevClose = i > 0 && Array.isArray(rawPrices[i - 1]) ? Number(rawPrices[i - 1][1]) : close;
    const open = prevClose;

    // Estimate high/low based on price movement
    // Use a small percentage variation or the actual range if price moved
    const priceChange = Math.abs(close - open);
    const volatility = Math.max(priceChange, close * 0.01); // At least 1% volatility
    const high = Math.max(open, close) + volatility * 0.3;
    const low = Math.min(open, close) - volatility * 0.3;

    normalized.push({
      date: new Date(timestamp).toISOString().slice(0, 10),
      open,
      high,
      low,
      close,
    });
  }

  return normalized;
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
  const [monteCarloTrajectory, setMonteCarloTrajectory] = useState<MonteCarloTrajectoryPoint[] | null>(null);
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

  const handleMonteCarloPathUpdate = useCallback(
    (trajectory: MonteCarloTrajectoryPoint[] | null) => {
      setMonteCarloTrajectory(trajectory);
    },
    [],
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
    let simulationOverlay: StrategyOverlay | null = null;

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
        history = await fetchCoinGeckoPriceHistory(coinId);
        priceHistoryCacheRef.current.set(coinId, { data: history, fetchedAt: now });
      }

      if (priceHistoryRequestRef.current !== historyRequestId) {
        return;
      }

      if (!history.length) {
        throw new Error("CoinGecko returned no price history for this token.");
      }

      setPriceHistory(history);
      const assetLabel = tokenFromState || coinId;
      chartProjection = buildChartProjectionPayload(history, monteCarloHorizon, assetLabel);
      setMonteCarloTrajectory(chartProjection.projection.length ? chartProjection.projection : null);
      projectionSeries = chartProjection.projection.map((point) => ({
        timestamp: point.x,
        price: point.y,
        date: new Date(point.x).toISOString().slice(0, 10),
      }));
      setProjectionStartTimestamp(projectionSeries[0]?.timestamp ?? 0);

      if (activeCalculatorId === "trend-following" && chartProjection) {
        const maPeriodValue = Number((currentState as Record<string, unknown>).maPeriod ?? 50);
        const initialCapitalValue = Number((currentState as Record<string, unknown>).initialCapital ?? 10000);

        if (Number.isFinite(maPeriodValue) && Number.isFinite(initialCapitalValue)) {
          trendSimulation = simulateTrendFollowingStrategy({
            chartProjection,
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

      if (activeCalculatorId === "dca" && chartProjection) {
        const amountValue = Number((currentState as Record<string, unknown>).amount ?? 0);
        const intervalValue = typeof currentState.interval === "string" ? currentState.interval : "bi-weekly";
        const durationValue = typeof currentState.duration === "string" ? currentState.duration : "6 months";
        const intervalDays = resolveIntervalToDays(intervalValue);
        const durationMonths = resolveDurationToMonths(durationValue);

        if (Number.isFinite(amountValue) && amountValue > 0) {
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
      setIsLoading(false);
      return;
    } finally {
      if (priceHistoryRequestRef.current === historyRequestId) {
        setIsPriceHistoryLoading(false);
      }
    }

    try {
      const extras: Record<string, unknown> = {};
      if (trendSimulation) {
        extras.trendSimulation = trendSimulation;
      }
      if (dcaSimulation) {
        extras.strategySimulation = dcaSimulation;
      }

      const { prompt, options } = activeDefinition.getRequestConfig(
        currentState as any,
        chartProjection,
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
      } = activeDefinition.parseReply(reply);

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
      setStrategyOverlays(simulationOverlay ? [simulationOverlay] : []);
      setDcaSimulation(null);
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
      priceHistoryRequestRef.current += 1;
      setNovaDataset([]);
      setPriceHistory([]);
      setPriceHistoryError(null);
      setIsPriceHistoryLoading(false);
      setMonteCarloTrajectory(null);
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
    priceHistoryRequestRef.current += 1;
    setPriceHistory([]);
    setPriceHistoryError(null);
    setIsPriceHistoryLoading(false);
    setMonteCarloTrajectory(null);
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
      onMonteCarloPath={handleMonteCarloPathUpdate}
      monteCarloHorizon={monteCarloHorizon}
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
