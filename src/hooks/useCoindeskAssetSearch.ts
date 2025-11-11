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

const SEARCH_ENDPOINT = "https://production.api.coindesk.com/v2/search/asset";
const DEBOUNCE_MS = 300;
const COINDESK_API_KEY = process.env.NEXT_PUBLIC_COINDESK_API_KEY;

function normaliseAsset(entry: unknown): CoindeskAsset | null {
  if (typeof entry !== "object" || entry === null) {
    return null;
  }

  const candidate = entry as Record<string, unknown>;
  const symbolSource = candidate.symbol ?? candidate.ticker ?? candidate.symbol_id ?? candidate.code;
  const nameSource = candidate.name ?? candidate.title ?? candidate.fullName ?? candidate.displayName;
  const slugSource = candidate.slug ?? candidate.id ?? candidate.assetId ?? candidate.slug_name;

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

  const dataLayer = (payload as Record<string, unknown>).data;
  const collections: unknown[] = [];

  if (Array.isArray((payload as Record<string, unknown>).results)) {
    collections.push((payload as Record<string, unknown>).results);
  }

  if (dataLayer && typeof dataLayer === "object") {
    const dataRecord = dataLayer as Record<string, unknown>;

    if (Array.isArray(dataRecord.assets)) {
      collections.push(dataRecord.assets);
    }

    if (Array.isArray(dataRecord.searchResults)) {
      collections.push(dataRecord.searchResults);
    }

    if (Array.isArray(dataRecord.items)) {
      collections.push(dataRecord.items);
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
      setIsLoading(false);
      setError("Token search requires a CoinDesk API key. Showing popular tokens instead.");
      return;
    }

    const controller = new AbortController();
    abortController.current = controller;
    setIsLoading(true);
    setError(null);

    const requestUrl = `${SEARCH_ENDPOINT}?query=${encodeURIComponent(debouncedQuery)}`;

    fetch(requestUrl, {
      headers: {
        Accept: "application/json",
        "X-CoinDesk-API-Key": COINDESK_API_KEY,
      },
      signal: controller.signal,
    })
      .then((response) => {
        if (response.status === 401 || response.status === 403) {
          const authError = new Error("CoinDeskAuthError");
          authError.name = "CoinDeskAuthError";
          throw authError;
        }

        if (!response.ok) {
          throw new Error(`Coindesk search failed (${response.status})`);
        }
        return response.json();
      })
      .then((payload) => {
        const parsedAssets = parseAssetResults(payload);
        if (parsedAssets.length === 0) {
          setAssets([]);
        } else {
          setAssets(parsedAssets);
        }
        setError(null);
      })
      .catch((requestError: unknown) => {
        if ((requestError as Error)?.name === "AbortError") {
          return;
        }

        if ((requestError as Error)?.name === "CoinDeskAuthError") {
          setError("Token search requires a CoinDesk API key. Showing popular tokens instead.");
        } else {
          setError("We couldn't reach CoinDesk right now. Showing popular tokens instead.");
        }

        setAssets(FALLBACK_ASSETS);
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

    const fuse = new Fuse(assets, {
      keys: ["symbol", "name"],
      threshold: 0.35,
      ignoreLocation: true,
    });

    const results = fuse.search(debouncedQuery);

    if (results.length === 0) {
      return assets;
    }

    return results.map((result) => result.item);
  }, [assets, debouncedQuery]);

  return {
    assets: rankedAssets,
    isLoading,
    error,
  };
}
