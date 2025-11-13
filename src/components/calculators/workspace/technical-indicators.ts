import type { CoinGeckoCandle } from "@/components/calculators/types";

export type TechnicalPoint = {
  x: number;
  y: number;
};

function toTimestamp(dateString: string): number {
  return new Date(dateString).getTime();
}

/**
 * Builds a simple moving average series for the provided candles.
 */
export function buildMovingAverageSeries(candles: CoinGeckoCandle[], period: number): TechnicalPoint[] {
  const normalizedPeriod = Math.max(1, Math.trunc(period));
  const points: TechnicalPoint[] = [];
  let runningSum = 0;

  for (let i = 0; i < candles.length; i += 1) {
    const close = candles[i].close;
    runningSum += close;

    if (i >= normalizedPeriod) {
      runningSum -= candles[i - normalizedPeriod].close;
    }

    if (i >= normalizedPeriod - 1) {
      const average = runningSum / normalizedPeriod;
      points.push({ x: toTimestamp(candles[i].date), y: average });
    }
  }

  return points;
}

/**
 * Builds a rolling maximum (recent high) series over the provided lookback window.
 */
export function buildRollingHighSeries(candles: CoinGeckoCandle[], lookbackPeriod: number): TechnicalPoint[] {
  const normalizedPeriod = Math.max(1, Math.trunc(lookbackPeriod));
  const points: TechnicalPoint[] = [];

  for (let i = 0; i < candles.length; i += 1) {
    const windowStart = Math.max(0, i - normalizedPeriod + 1);
    let highest = -Infinity;

    for (let j = windowStart; j <= i; j += 1) {
      highest = Math.max(highest, candles[j].close);
    }

    if (Number.isFinite(highest)) {
      points.push({ x: toTimestamp(candles[i].date), y: highest });
    }
  }

  return points;
}

export type DipTriggerSeries = {
  recentHighs: TechnicalPoint[];
  thresholdLine: TechnicalPoint[];
  dipEvents: TechnicalPoint[];
};

/**
 * Computes the recent high line, dip threshold line, and events that would trigger a buy-the-dip deployment.
 */
export function buildDipTriggerSeries(
  candles: CoinGeckoCandle[],
  thresholdPercent: number,
  lookbackPeriod: number,
): DipTriggerSeries {
  const normalizedThreshold = Number.isFinite(thresholdPercent) ? thresholdPercent : 0;
  const recentHighs = buildRollingHighSeries(candles, lookbackPeriod);
  const thresholdLine: TechnicalPoint[] = [];
  const dipEvents: TechnicalPoint[] = [];

  const thresholdFactor = Math.max(0, normalizedThreshold / 100);

  if (thresholdFactor === 0) {
    return { recentHighs, thresholdLine, dipEvents };
  }

  for (let i = 0; i < candles.length; i += 1) {
    const highPoint = recentHighs[i];
    if (!highPoint || !Number.isFinite(highPoint.y)) {
      continue;
    }

    const thresholdValue = highPoint.y * (1 - thresholdFactor);
    thresholdLine.push({ x: highPoint.x, y: thresholdValue });

    const candle = candles[i];
    if (candle.close <= thresholdValue) {
      dipEvents.push({ x: highPoint.x, y: candle.close });
    }
  }

  return { recentHighs, thresholdLine, dipEvents };
}
