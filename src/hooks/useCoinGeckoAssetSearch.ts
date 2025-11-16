"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import { searchAssets, type CoinGeckoAsset } from "@/lib/coingecko-client";

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

const DEBOUNCE_MS = 300;
const SEARCH_RESULT_LIMIT = 20;

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

    searchAssets(debouncedQuery, controller.signal)
      .then((parsedAssets) => {
        // Limit results
        const limitedAssets = parsedAssets.slice(0, SEARCH_RESULT_LIMIT);
        if (limitedAssets.length === 0) {
          setAssets([]);
        } else {
          setAssets(limitedAssets);
        }
        setIsUsingFallback(false);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if ((requestError as Error)?.name === "AbortError") {
          return;
        }

        const errorMessage = requestError instanceof Error ? requestError.message : String(requestError);

        if (errorMessage.includes("rate limit")) {
          setError("CoinGecko is rate limiting token search. Showing popular tokens instead.");
        } else if (errorMessage.includes("400") || errorMessage.includes("BadRequest")) {
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
