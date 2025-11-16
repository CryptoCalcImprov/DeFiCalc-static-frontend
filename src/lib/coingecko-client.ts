import { retryFetch } from "./http/retry-fetch";
import { getLimiter } from "./http/request-limiter";
import { globalCache } from "./http/memo-cache";
import type { CoinGeckoCandle } from "@/components/calculators/types";

export type CoinGeckoAsset = {
  symbol: string;
  name: string;
  slug?: string;
};

const COINGECKO_API_BASE_URL = "https://api.coingecko.com/api/v3";
const DEFAULT_SEARCH_ENDPOINT = `${COINGECKO_API_BASE_URL}/search`;
const SEARCH_ENDPOINT =
  process.env.NEXT_PUBLIC_COINGECKO_SEARCH_ENDPOINT ?? DEFAULT_SEARCH_ENDPOINT;

// Cache TTLs
const SEARCH_CACHE_TTL_MS = 15 * 1000; // 15 seconds for search
const MARKET_CHART_CACHE_TTL_MS = 60 * 1000; // 60 seconds for price history

// In-flight request deduplication
const inflightRequests = new Map<string, Promise<unknown>>();

function getHostFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return "api.coingecko.com";
  }
}

function createCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `coingecko:${prefix}:${parts.join(":")}`;
}

function normaliseAsset(entry: unknown): CoinGeckoAsset | null {
  if (typeof entry !== "object" || entry === null) {
    return null;
  }

  const candidate = entry as Record<string, unknown>;
  const symbolSource = candidate.symbol;
  const nameSource = candidate.name;
  const slugSource = candidate.id ?? candidate.api_symbol;

  if (typeof symbolSource !== "string") {
    return null;
  }

  const symbol = symbolSource.trim().toUpperCase();
  if (!symbol) {
    return null;
  }

  const name = typeof nameSource === "string" && nameSource.trim().length > 0 ? nameSource.trim() : symbol;
  const slug = typeof slugSource === "string" && slugSource.trim().length > 0 ? slugSource.trim() : undefined;

  return { symbol, name, slug };
}

function parseAssetResults(payload: unknown): CoinGeckoAsset[] {
  if (payload === null || typeof payload !== "object") {
    return [];
  }

  const payloadRecord = payload as Record<string, unknown>;
  const coins = payloadRecord.coins;

  if (!Array.isArray(coins)) {
    return [];
  }

  return coins
    .map(normaliseAsset)
    .filter((asset): asset is CoinGeckoAsset => Boolean(asset))
    .reduce<CoinGeckoAsset[]>((acc, asset) => {
      // Deduplicate by symbol, keeping first occurrence
      if (!acc.some((existing) => existing.symbol === asset.symbol)) {
        acc.push(asset);
      }
      return acc;
    }, []);
}

async function executeWithDedupe<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  const existing = inflightRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = fn().finally(() => {
    inflightRequests.delete(key);
  });

  inflightRequests.set(key, promise);
  return promise;
}

export async function searchAssets(
  query: string,
  signal?: AbortSignal,
): Promise<CoinGeckoAsset[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return [];
  }

  const cacheKey = createCacheKey("search", normalizedQuery);
  const dedupeKey = `search:${normalizedQuery}`;

  return executeWithDedupe(dedupeKey, async () => {
    return globalCache.withCache(cacheKey, SEARCH_CACHE_TTL_MS, async () => {
      const requestUrl = new URL(SEARCH_ENDPOINT);
      requestUrl.searchParams.set("query", normalizedQuery);

      const host = getHostFromUrl(requestUrl.toString());
      const limiter = getLimiter(host);
      await limiter.take(host);

      const response = await retryFetch(requestUrl, {
        signal,
        method: "GET",
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("CoinGecko rate limit exceeded. Please wait a moment and try again.");
        }
        throw new Error(`CoinGecko search failed (${response.status})`);
      }

      const payload = await response.json().catch(() => ({} as Record<string, unknown>));
      return parseAssetResults(payload);
    });
  });
}

export async function getMarketChart(
  assetId: string,
  days: string | number = "365",
  vsCurrency: string = "usd",
  signal?: AbortSignal,
): Promise<CoinGeckoCandle[]> {
  const normalizedAssetId = assetId.trim();
  if (!normalizedAssetId) {
    throw new Error("Asset ID is required");
  }

  const cacheKey = createCacheKey("market_chart", normalizedAssetId, String(days), vsCurrency);
  const dedupeKey = `market_chart:${normalizedAssetId}:${days}:${vsCurrency}`;

  return executeWithDedupe(dedupeKey, async () => {
    return globalCache.withCache(cacheKey, MARKET_CHART_CACHE_TTL_MS, async () => {
      const requestUrl = new URL(`${COINGECKO_API_BASE_URL}/coins/${normalizedAssetId}/market_chart`);
      requestUrl.searchParams.set("vs_currency", vsCurrency);
      requestUrl.searchParams.set("days", String(days));

      const host = getHostFromUrl(requestUrl.toString());
      const limiter = getLimiter(host);
      await limiter.take(host);

      const response = await retryFetch(requestUrl, {
        signal,
        method: "GET",
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("CoinGecko rate limit exceeded. Please wait a moment and try again.");
        }
        throw new Error(`CoinGecko price history fetch failed (${response.status})`);
      }

      const payload = await response.json().catch(() => ({} as Record<string, unknown>));
      const rawPrices = Array.isArray(payload.prices) ? payload.prices : [];

      if (rawPrices.length === 0) {
        return [];
      }

      // Convert daily price data to OHLC candles
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
    });
  });
}

