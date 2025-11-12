"use client";

import type { FormEvent } from "react";
import { useRef, useState } from "react";

import { calculatorDefinitions, findCalculatorDefinition } from "@/components/calculators";
import type { CalculatorInsight, CoinGeckoCandle, TimeSeriesPoint } from "@/components/calculators/types";
import { CalculatorDeck } from "@/components/calculators/workspace/CalculatorDeck";
import { CalculatorWorkspace } from "@/components/calculators/workspace/CalculatorWorkspace";
import { PriceTrajectoryPanel } from "@/components/calculators/workspace/PriceTrajectoryPanel";
import { SummaryPanel } from "@/components/calculators/workspace/SummaryPanel";
import { Button } from "@/components/ui/button";
import { clearNovaHistory, requestNova } from "@/lib/nova-client";
import { ensureNovaRefId, resetNovaRefId } from "@/lib/nova-session";
import { TrendFollowingChart, type TrendFollowingDataPoint } from "@/components/calculators/trend-following/trend-following-chart";
import { parseTrendFollowingReply } from "@/components/calculators/trend-following/parser";

const defaultCalculatorId = calculatorDefinitions[0]?.id ?? "";
const defaultDefinition = defaultCalculatorId ? findCalculatorDefinition<any>(defaultCalculatorId) : undefined;

const defaultSummary =
  defaultDefinition?.initialSummary ?? "Run a projection to see Nova’s perspective on this plan.";

const COINGECKO_API_BASE_URL = "https://api.coingecko.com/api/v3";
const COINGECKO_SEARCH_ENDPOINT =
  process.env.NEXT_PUBLIC_COINGECKO_SEARCH_ENDPOINT ?? `${COINGECKO_API_BASE_URL}/search`;
const PRICE_HISTORY_CACHE_TTL_MS = 1000 * 60 * 2;

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
  const [trendFollowingDataset, setTrendFollowingDataset] = useState<TrendFollowingDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  const activeDefinition = findCalculatorDefinition<any>(activeCalculatorId);

  const formState = (calculatorStates[activeCalculatorId] ??
    activeDefinition?.getInitialState?.() ??
    {}) as Record<string, unknown>;

  const seriesLabel =
    (activeDefinition?.getSeriesLabel ? activeDefinition.getSeriesLabel(formState as any) : undefined) ?? "Modeled price";

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
    setPriceHistory([]);
    setPriceHistoryError(null);
    setIsPriceHistoryLoading(true);

    const tokenFromState = typeof currentState.token === "string" ? currentState.token.trim() : "";
    const explicitTokenId =
      typeof currentState.tokenId === "string" && currentState.tokenId.trim()
        ? currentState.tokenId.trim()
        : undefined;

    const historyRequestId = priceHistoryRequestRef.current + 1;
    priceHistoryRequestRef.current = historyRequestId;

    void (async () => {
      try {
        const coinId =
          explicitTokenId ?? (tokenFromState ? await searchCoinGeckoAssetId(tokenFromState) : null);
        if (!coinId) {
          throw new Error("Unable to resolve a CoinGecko ID for the selected token.");
        }

        const cacheEntry = priceHistoryCacheRef.current.get(coinId);
        const now = Date.now();
        if (cacheEntry && now - cacheEntry.fetchedAt < PRICE_HISTORY_CACHE_TTL_MS) {
          setPriceHistory(cacheEntry.data);
          return;
        }

        const history = await fetchCoinGeckoPriceHistory(coinId);
        if (priceHistoryRequestRef.current !== historyRequestId) {
          return;
        }

        if (!history.length) {
          throw new Error("CoinGecko returned no price history for this token.");
        }

        setPriceHistory(history);
        priceHistoryCacheRef.current.set(coinId, { data: history, fetchedAt: now });
      } catch (historyError) {
        if (priceHistoryRequestRef.current !== historyRequestId) {
          return;
        }

        const message =
          historyError instanceof Error
            ? historyError.message
            : "Unable to load price history from CoinGecko.";
        setPriceHistoryError(message);
      } finally {
        if (priceHistoryRequestRef.current !== historyRequestId) {
          return;
        }
        setIsPriceHistoryLoading(false);
      }
    })();

    try {
      const { prompt, options } = activeDefinition.getRequestConfig(currentState as any);
      const refId = ensureNovaRefId("calculator");
      const { reply } = await requestNova(prompt, options, { refId });

      const {
        insight: parsedInsight,
        dataset: parsedDataset,
        fallbackSummary: parsedFallbackSummary,
        fallbackLines: parsedFallbackLines,
      } = activeDefinition.parseReply(reply);

      setInsight(parsedInsight ?? null);
      setNovaDataset(parsedDataset);

      if (parsedInsight) {
        setSummaryMessage("");
        setFallbackLines([]);
      } else {
        const fallbackSummaryLines = parsedFallbackLines ?? [];
        setFallbackLines(fallbackSummaryLines);
        const summaryText =
          parsedFallbackSummary ??
          (fallbackSummaryLines.length ? "" : "Nova did not return a structured summary for this run.");
        setSummaryMessage(summaryText);
      }

      // If this is the trend-following calculator, parse the extended data
      if (activeCalculatorId === "trend-following") {
        const trendFollowingResult = parseTrendFollowingReply(reply);
        setTrendFollowingDataset(trendFollowingResult.dataset);
      }

      if (!parsedDataset.length) {
        setError("Nova didn't return price history data for this run. Displaying the structured insight instead.");
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
    setTrendFollowingDataset([]);
    setIsDeckOpen(false);

    setInsight(null);
    setFallbackLines([]);
    setSummaryMessage(nextDefinition?.initialSummary ?? defaultSummary);
    priceHistoryRequestRef.current += 1;
    setPriceHistory([]);
    setPriceHistoryError(null);
    setIsPriceHistoryLoading(false);

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
      chartPanel={
        activeCalculatorId === "trend-following" ? (
          <TrendFollowingChart
            dataset={trendFollowingDataset}
            isLoading={isLoading}
            token={(formState as any).token ?? "BTC"}
          />
        ) : (
          <PriceTrajectoryPanel
            dataset={priceHistory}
            isLoading={isPriceHistoryLoading}
            seriesLabel={seriesLabel}
            loadingMessage="Fetching price history from CoinGecko…"
            emptyMessage={
              priceHistoryError ?? "Run the projection to visualize one year of CoinGecko price history."
            }
          />
        )
      }
    />
  );
}
