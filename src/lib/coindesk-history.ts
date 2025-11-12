import type { TimeSeriesPoint } from "@/components/calculators/types";

const DEFAULT_INDEX_BASE_URL = "https://data-api.coindesk.com/index/cc/v1";
const DEFAULT_MARKET = "cadli";
const DEFAULT_QUOTE = "USD";

type CoindeskHistoryCandle = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type CoindeskHistoryResult = {
  symbol: string;
  instrument: string;
  market: string;
  startDate: string;
  endDate: string;
  candles: CoindeskHistoryCandle[];
  summary: string;
  dataset: TimeSeriesPoint[];
};

type FetchHistoryParams = {
  symbol: string;
  market?: string;
  durationDays: number;
  quoteCurrency?: string;
};

const COINDESK_API_KEY = process.env.NEXT_PUBLIC_COINDESK_API_KEY?.trim();
const COINDESK_INDEX_BASE_URL =
  process.env.NEXT_PUBLIC_COINDESK_INDEX_BASE_URL?.trim() ?? DEFAULT_INDEX_BASE_URL;

function toUtcDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function ensureDurationDays(durationDays: number) {
  if (!Number.isFinite(durationDays) || durationDays <= 1) {
    return 30;
  }

  const clamped = Math.min(Math.floor(durationDays), 730);
  return Math.max(clamped, 7);
}

function buildInstrument(symbol: string, quoteCurrency: string) {
  const trimmedSymbol = symbol?.trim().toUpperCase();
  if (!trimmedSymbol) {
    throw new Error("Token symbol is required to fetch CoinDesk history.");
  }
  const trimmedQuote = quoteCurrency?.trim().toUpperCase() || DEFAULT_QUOTE;
  return `${trimmedSymbol}-${trimmedQuote}`;
}

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) {
    return "N/A";
  }

  const abs = Math.abs(value);
  const decimals = abs >= 1 ? 2 : 6;
  return `$${value.toFixed(decimals)}`;
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) {
    return "N/A";
  }

  const sign = value > 0 ? "+" : value < 0 ? "" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function pickRecentCloses(candles: CoindeskHistoryCandle[]) {
  const sliceStart = Math.max(candles.length - 10, 0);
  return candles
    .slice(sliceStart)
    .map((candle) => formatCurrency(candle.close));
}

function pickSamplePrices(candles: CoindeskHistoryCandle[]) {
  if (candles.length <= 30) {
    return [];
  }

  const sampleCount = Math.min(5, Math.ceil(candles.length / 60));
  const samples: string[] = [];

  for (let i = 0; i < sampleCount; i++) {
    const ratio = i / Math.max(sampleCount - 1, 1);
    const index = Math.min(
      candles.length - 1,
      Math.round(ratio * (candles.length - 1)),
    );
    const candle = candles[index];
    samples.push(`${candle.date}: ${formatCurrency(candle.close)}`);
  }

  return Array.from(new Set(samples));
}

function buildHistorySummary(params: {
  symbol: string;
  instrument: string;
  market: string;
  startDate: string;
  endDate: string;
  candles: CoindeskHistoryCandle[];
}) {
  const { symbol, instrument, market, startDate, endDate, candles } = params;

  if (!candles.length) {
    return "⚠️ No CoinDesk price data returned for the requested period.";
  }

  const firstCandle = candles[0];
  const lastCandle = candles[candles.length - 1];
  const highs = candles.map((candle) => candle.high);
  const lows = candles.map((candle) => candle.low);
  const high = Math.max(...highs);
  const low = Math.min(...lows);
  const percentChange =
    ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100;

  const trendIcon =
    percentChange > 0.001 ? "📈" : percentChange < -0.001 ? "📉" : "📊";

  const lines = [
    `${trendIcon} ${symbol.toUpperCase()} (${market} • ${instrument}) ${startDate} → ${endDate}`,
    `First day open (${startDate}): ${formatCurrency(firstCandle.open)}`,
    `Last day close (${endDate}): ${formatCurrency(lastCandle.close)}`,
    `Percent change: ${formatPercent(percentChange)}`,
    `High / Low: ${formatCurrency(high)} / ${formatCurrency(low)}`,
    `Data points: ${candles.length}`,
  ];

  const recent = pickRecentCloses(candles);
  if (recent.length) {
    lines.push(`Recent closes: ${recent.join(", ")}`);
  }

  const samplePrices = pickSamplePrices(candles);
  if (samplePrices.length) {
    lines.push(`Sample prices: ${samplePrices.join(" | ")}`);
  }

  const today = toUtcDateString(new Date());
  if (endDate < today) {
    lines.push(
      "⚠️ Last day close is historical. Use a spot quote tool for current pricing.",
    );
  }

  return lines.join("\n");
}

function parseHistoryCandles(payload: unknown): CoindeskHistoryCandle[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const dataLayer = (payload as Record<string, unknown>).Data;
  if (!Array.isArray(dataLayer)) {
    return [];
  }

  const candles = dataLayer
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const record = entry as Record<string, unknown>;
      const timestamp = Number(record.TIMESTAMP ?? record.timestamp);
      const open = Number(record.OPEN ?? record.open);
      const high = Number(record.HIGH ?? record.high);
      const low = Number(record.LOW ?? record.low);
      const close = Number(record.CLOSE ?? record.close);

      if (
        Number.isNaN(timestamp) ||
        Number.isNaN(open) ||
        Number.isNaN(high) ||
        Number.isNaN(low) ||
        Number.isNaN(close)
      ) {
        return null;
      }

      const isoDate = toUtcDateString(new Date(timestamp * 1000));

      return {
        date: isoDate,
        open,
        high,
        low,
        close,
      };
    })
    .filter(Boolean) as CoindeskHistoryCandle[];

  return candles.sort((a, b) => (a.date > b.date ? 1 : -1));
}

export async function fetchCoindeskHistoryWithSummary(
  params: FetchHistoryParams,
): Promise<CoindeskHistoryResult> {
  if (!COINDESK_API_KEY) {
    throw new Error("CoinDesk API key is required to fetch price history.");
  }

  const durationDays = ensureDurationDays(params.durationDays);
  const market = params.market?.trim().toLowerCase() || DEFAULT_MARKET;
  const quoteCurrency = params.quoteCurrency ?? DEFAULT_QUOTE;
  const instrument = buildInstrument(params.symbol, quoteCurrency);

  const utcToday = new Date();
  const endDate = new Date(
    Date.UTC(
      utcToday.getUTCFullYear(),
      utcToday.getUTCMonth(),
      utcToday.getUTCDate(),
    ),
  );
  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - (durationDays - 1));

  const startTimestamp = Math.floor(startDate.getTime() / 1000);
  const endTimestamp = Math.floor(endDate.getTime() / 1000);

  const requestUrl = new URL(
    `${COINDESK_INDEX_BASE_URL.replace(/\/$/, "")}/historical/days`,
  );
  requestUrl.searchParams.set("market", market);
  requestUrl.searchParams.set("instrument", instrument);
  requestUrl.searchParams.set("start_time", String(startTimestamp));
  requestUrl.searchParams.set("end_time", String(endTimestamp));
  requestUrl.searchParams.set("groups", "OHLC");
  requestUrl.searchParams.set("api_key", COINDESK_API_KEY);

  const response = await fetch(requestUrl);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      text || `CoinDesk history request failed (${response.status}).`,
    );
  }

  const payload = await response
    .json()
    .catch(() => ({} as Record<string, unknown>));
  const errLayer = (payload as Record<string, unknown>).Err;
  if (errLayer && typeof errLayer === "object" && Object.keys(errLayer).length) {
    const errorMessage =
      typeof (errLayer as Record<string, unknown>).message === "string"
        ? ((errLayer as Record<string, unknown>).message as string)
        : "CoinDesk returned an error for this request.";
    throw new Error(errorMessage);
  }

  const candles = parseHistoryCandles(payload);
  if (!candles.length) {
    throw new Error("CoinDesk returned no historical candles for this token.");
  }

  const summary = buildHistorySummary({
    symbol: params.symbol,
    instrument,
    market,
    startDate: toUtcDateString(startDate),
    endDate: toUtcDateString(endDate),
    candles,
  });

  const dataset: TimeSeriesPoint[] = candles.map((candle) => ({
    date: candle.date,
    price: Number(candle.close.toFixed(8)),
  }));

  return {
    symbol: params.symbol,
    instrument,
    market,
    startDate: toUtcDateString(startDate),
    endDate: toUtcDateString(endDate),
    candles,
    summary,
    dataset,
  };
}
