"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";

export type CoinGeckoAsset = {
  symbol: string;
  name: string;
  slug?: string;
};

export type UseCoinGeckoAssetSearchResult = {
  assets: CoinGeckoAsset[];
  isLoading: boolean;
  error: string | null;
};

const FALLBACK_ASSETS: CoinGeckoAsset[] = [
  { symbol: "BTC", name: "Bitcoin", slug: "bitcoin" },
  { symbol: "ETH", name: "Ethereum", slug: "ethereum" },
  { symbol: "SOL", name: "Solana", slug: "solana" },
  { symbol: "AVAX", name: "Avalanche", slug: "avalanche" },
  { symbol: "MATIC", name: "Polygon", slug: "polygon" },
  { symbol: "ADA", name: "Cardano", slug: "cardano" },
];

const DEFAULT_SEARCH_ENDPOINT = "https://api.coingecko.com/api/v3/search";
const SEARCH_ENDPOINT =
  process.env.NEXT_PUBLIC_COINGECKO_SEARCH_ENDPOINT ?? DEFAULT_SEARCH_ENDPOINT;
const DEBOUNCE_MS = 300;
const SEARCH_RESULT_LIMIT = 20;

function normaliseAsset(entry: unknown): CoinGeckoAsset | null {
  if (typeof entry !== "object" || entry === null) {
    return null;
  }

  const candidate = entry as Record<string, unknown>;
  // CoinGecko search returns coins with: id, name, api_symbol, symbol, market_cap_rank, thumb, large
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
  // CoinGecko search returns: { coins: [...], exchanges: [...], categories: [...], nfts: [...] }
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
    }, [])
    .slice(0, SEARCH_RESULT_LIMIT); // Limit results
}

export function useCoinGeckoAssetSearch(query: string): UseCoinGeckoAssetSearchResult {
  const [assets, setAssets] = useState<CoinGeckoAsset[]>(FALLBACK_ASSETS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState(query.trim());
  const [isUsingFallback, setIsUsingFallback] = useState(true);
  const abortController = useRef<AbortController | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(handle);
    };
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      if (abortController.current) {
        abortController.current.abort();
        abortController.current = null;
      }
      setAssets(FALLBACK_ASSETS);
      setIsUsingFallback(true);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    abortController.current = controller;
    setIsLoading(true);
    setError(null);

    const requestUrl = new URL(SEARCH_ENDPOINT);
    requestUrl.searchParams.set("query", debouncedQuery);

    fetch(requestUrl, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response
          .json()
          .catch(() => ({} as Record<string, unknown>));

        if (response.status === 429) {
          const rateLimitError = new Error("CoinGeckoRateLimitError");
          rateLimitError.name = "CoinGeckoRateLimitError";
          throw rateLimitError;
        }

        if (response.status === 400) {
          const badRequestError = new Error("CoinGeckoBadRequestError");
          badRequestError.name = "CoinGeckoBadRequestError";
          throw badRequestError;
        }

        if (!response.ok) {
          throw new Error(`CoinGecko search failed (${response.status})`);
        }

        return payload;
      })
      .then((payload) => {
        const parsedAssets = parseAssetResults(payload);
        if (parsedAssets.length === 0) {
          setAssets([]);
        } else {
          setAssets(parsedAssets);
        }
        setIsUsingFallback(false);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if ((requestError as Error)?.name === "AbortError") {
          return;
        }

        const errorName = (requestError as Error)?.name;

        if (errorName === "CoinGeckoRateLimitError") {
          setError("CoinGecko is rate limiting token search. Showing popular tokens instead.");
        } else if (errorName === "CoinGeckoBadRequestError") {
          setError("CoinGecko couldn't understand that search. Try a different query.");
        } else {
          setError("We couldn't reach CoinGecko right now. Showing popular tokens instead.");
        }

        setAssets(FALLBACK_ASSETS);
        setIsUsingFallback(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

  const rankedAssets = useMemo(() => {
    if (!debouncedQuery) {
      return assets;
    }

    if (assets.length === 0) {
      return assets;
    }

    // Only apply fuzzy search to API results, not fallback assets
    // Fallback assets should only be shown when query is empty
    if (isUsingFallback) {
      // For fallback assets, do a simple case-insensitive filter
      const queryUpper = debouncedQuery.toUpperCase();
      return assets.filter(
        (asset) =>
          asset.symbol.toUpperCase().includes(queryUpper) ||
          asset.name.toUpperCase().includes(queryUpper)
      );
    }

    // For API results, use fuzzy search with a stricter threshold
    const fuse = new Fuse(assets, {
      keys: ["symbol", "name"],
      threshold: 0.4, // Slightly stricter threshold
      ignoreLocation: true,
      minMatchCharLength: 2, // Require at least 2 characters to match
    });

    const results = fuse.search(debouncedQuery);

    // Return empty array if no matches found (don't show all assets)
    if (results.length === 0) {
      return [];
    }

    return results.map((result) => result.item);
  }, [assets, debouncedQuery, isUsingFallback]);

  return {
    assets: rankedAssets,
    isLoading,
    error,
  };
}
