"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";

export type CoindeskAsset = {
  symbol: string;
  name: string;
  slug?: string;
};

export type UseCoindeskAssetSearchResult = {
  assets: CoindeskAsset[];
  isLoading: boolean;
  error: string | null;
};

const FALLBACK_ASSETS: CoindeskAsset[] = [
  { symbol: "BTC", name: "Bitcoin", slug: "bitcoin" },
  { symbol: "ETH", name: "Ethereum", slug: "ethereum" },
  { symbol: "SOL", name: "Solana", slug: "solana" },
  { symbol: "AVAX", name: "Avalanche", slug: "avalanche" },
  { symbol: "MATIC", name: "Polygon", slug: "polygon" },
  { symbol: "ADA", name: "Cardano", slug: "cardano" },
];

const DEFAULT_SEARCH_ENDPOINT = "https://data-api.coindesk.com/asset/v1/search";
const SEARCH_ENDPOINT =
  process.env.NEXT_PUBLIC_COINDESK_ASSET_SEARCH_ENDPOINT ?? DEFAULT_SEARCH_ENDPOINT;
const DEBOUNCE_MS = 300;
const COINDESK_API_KEY = process.env.NEXT_PUBLIC_COINDESK_API_KEY;
const SEARCH_RESULT_LIMIT = 20;

function normaliseAsset(entry: unknown): CoindeskAsset | null {
  if (typeof entry !== "object" || entry === null) {
    return null;
  }

  const candidate = entry as Record<string, unknown>;
  const symbolSource =
    candidate.symbol ??
    candidate.SYMBOL ??
    candidate.ticker ??
    candidate.TICKER ??
    candidate.symbol_id ??
    candidate.code;
  const nameSource =
    candidate.name ??
    candidate.NAME ??
    candidate.title ??
    candidate.TITLE ??
    candidate.fullName ??
    candidate.displayName;
  const slugSource =
    candidate.slug ??
    candidate.SLUG ??
    candidate.URI ??
    candidate.uri ??
    candidate.id ??
    candidate.ID ??
    candidate.assetId ??
    candidate.slug_name;

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

function parseAssetResults(payload: unknown): CoindeskAsset[] {
  if (payload === null || typeof payload !== "object") {
    return [];
  }

  const payloadRecord = payload as Record<string, unknown>;
  const dataLayer = (payloadRecord.data ?? payloadRecord.Data) as unknown;
  const collections: unknown[] = [];

  if (Array.isArray(payloadRecord.results)) {
    collections.push(payloadRecord.results);
  }

  if (dataLayer && typeof dataLayer === "object") {
    const dataRecord = dataLayer as Record<string, unknown>;

    if (Array.isArray(dataRecord.assets)) {
      collections.push(dataRecord.assets);
    }

    const searchResults = dataRecord.searchResults ?? dataRecord.LIST ?? dataRecord.list;
    if (Array.isArray(searchResults)) {
      collections.push(searchResults);
    }

    const items = dataRecord.items ?? dataRecord.ITEMS ?? dataRecord.items_list;
    if (Array.isArray(items)) {
      collections.push(items);
    }

    if (Array.isArray(dataRecord.assets)) {
      collections.push(dataRecord.assets);
    }

    if (Array.isArray(dataRecord.ASSETS)) {
      collections.push(dataRecord.ASSETS);
    }
  }

  if (collections.length === 0 && Array.isArray(dataLayer)) {
    collections.push(dataLayer);
  }

  const flattened = collections.flat();

  return flattened
    .map(normaliseAsset)
    .filter((asset): asset is CoindeskAsset => Boolean(asset))
    .reduce<CoindeskAsset[]>((acc, asset) => {
      if (!acc.some((existing) => existing.symbol === asset.symbol)) {
        acc.push(asset);
      }
      return acc;
    }, []);
}

export function useCoindeskAssetSearch(query: string): UseCoindeskAssetSearchResult {
  const [assets, setAssets] = useState<CoindeskAsset[]>(FALLBACK_ASSETS);
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

    if (!COINDESK_API_KEY) {
      if (abortController.current) {
        abortController.current.abort();
        abortController.current = null;
      }
      setAssets(FALLBACK_ASSETS);
      setIsUsingFallback(true);
      setIsLoading(false);
      setError("Token search requires a CoinDesk API key. Showing popular tokens instead.");
      return;
    }

    const controller = new AbortController();
    abortController.current = controller;
    setIsLoading(true);
    setError(null);

    const requestUrl = new URL(SEARCH_ENDPOINT);
    requestUrl.searchParams.set("search_string", debouncedQuery);
    requestUrl.searchParams.set("limit", String(SEARCH_RESULT_LIMIT));
    requestUrl.searchParams.set("api_key", COINDESK_API_KEY);

    fetch(requestUrl, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response
          .json()
          .catch(() => ({} as Record<string, unknown>));

        if (response.status === 401 || response.status === 403) {
          const authError = new Error("CoinDeskAuthError");
          authError.name = "CoinDeskAuthError";
          throw authError;
        }

        if (response.status === 429) {
          const rateLimitError = new Error("CoinDeskRateLimitError");
          rateLimitError.name = "CoinDeskRateLimitError";
          throw rateLimitError;
        }

        if (response.status === 400) {
          const badRequestError = new Error("CoinDeskBadRequestError");
          badRequestError.name = "CoinDeskBadRequestError";
          throw badRequestError;
        }

        if (!response.ok) {
          throw new Error(`Coindesk search failed (${response.status})`);
        }

        if (payload && typeof payload === "object") {
          const errLayer = (payload as Record<string, unknown>).Err;
          // Only treat as error if Err exists and has actual error content (not just empty object)
          if (errLayer && typeof errLayer === "object") {
            const errRecord = errLayer as Record<string, unknown>;
            // Check if Err object has any actual error properties
            const hasErrorContent = Object.keys(errRecord).length > 0;
            if (hasErrorContent) {
              const apiError = new Error(
                typeof errRecord.message === "string" ? errRecord.message : "CoinDeskApiError",
              );
              apiError.name = "CoinDeskApiError";
              throw apiError;
            }
          }
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

        if (errorName === "CoinDeskAuthError") {
          setError("Token search requires a CoinDesk API key. Showing popular tokens instead.");
        } else if (errorName === "CoinDeskRateLimitError") {
          setError("CoinDesk is rate limiting token search. Showing popular tokens instead.");
        } else if (errorName === "CoinDeskBadRequestError") {
          setError("CoinDesk couldn't understand that search. Try a different query.");
        } else if (errorName === "CoinDeskApiError" && (requestError as Error)?.message) {
          setError((requestError as Error).message);
        } else {
          setError("We couldn't reach CoinDesk right now. Showing popular tokens instead.");
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
