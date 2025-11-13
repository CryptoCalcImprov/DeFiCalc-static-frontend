import type { CoinGeckoCandle } from "@/components/calculators/types";

export type TechnicalPoint = {
  x: number;
  y: number;
};

export type TimeSeriesValuePoint = {
  x: number;
  y: number;
};

function toTimestamp(dateString: string): number {
  return new Date(dateString).getTime();
}

function sortPoints(points: TimeSeriesValuePoint[]): TimeSeriesValuePoint[] {
  return [...points].sort((a, b) => a.x - b.x);
}

export function buildSeriesFromCandles(candles: CoinGeckoCandle[]): TimeSeriesValuePoint[] {
  return sortPoints(
    candles.map((candle) => ({
      x: toTimestamp(candle.date),
      y: candle.close,
    })),
  );
}

/**
 * Builds a simple moving average series for the provided time series.
 */
export function buildMovingAverageSeries(points: TimeSeriesValuePoint[], period: number): TechnicalPoint[] {
  const normalizedPeriod = Math.max(1, Math.trunc(period));
  const sortedPoints = sortPoints(points);
  const movingAverage: TechnicalPoint[] = [];
  let runningSum = 0;

  for (let index = 0; index < sortedPoints.length; index += 1) {
    runningSum += sortedPoints[index].y;

    if (index >= normalizedPeriod) {
      runningSum -= sortedPoints[index - normalizedPeriod].y;
    }

    if (index >= normalizedPeriod - 1) {
      movingAverage.push({
        x: sortedPoints[index].x,
        y: runningSum / normalizedPeriod,
      });
    }
  }

  return movingAverage;
}

/**
 * Builds a rolling maximum (recent high) series over the provided lookback window.
 */
export function buildRollingHighSeries(points: TimeSeriesValuePoint[], lookbackPeriod: number): TechnicalPoint[] {
  const normalizedPeriod = Math.max(1, Math.trunc(lookbackPeriod));
  const sortedPoints = sortPoints(points);
  const highs: TechnicalPoint[] = [];

  for (let i = 0; i < sortedPoints.length; i += 1) {
    const windowStart = Math.max(0, i - normalizedPeriod + 1);
    let highest = -Infinity;

    for (let j = windowStart; j <= i; j += 1) {
      highest = Math.max(highest, sortedPoints[j].y);
    }

    if (Number.isFinite(highest)) {
      highs.push({ x: sortedPoints[i].x, y: highest });
    }
  }

  return highs;
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
  points: TimeSeriesValuePoint[],
  thresholdPercent: number,
  lookbackPeriod: number,
): DipTriggerSeries {
  const normalizedThreshold = Number.isFinite(thresholdPercent) ? thresholdPercent : 0;
  const sortedPoints = sortPoints(points);
  const recentHighs = buildRollingHighSeries(sortedPoints, lookbackPeriod);
  const thresholdLine: TechnicalPoint[] = [];
  const dipEvents: TechnicalPoint[] = [];

  const thresholdFactor = Math.max(0, normalizedThreshold / 100);

  if (thresholdFactor === 0) {
    return { recentHighs, thresholdLine, dipEvents };
  }

  for (let i = 0; i < sortedPoints.length; i += 1) {
    const highPoint = recentHighs[i];
    if (!highPoint || !Number.isFinite(highPoint.y)) {
      continue;
    }

    const thresholdValue = highPoint.y * (1 - thresholdFactor);
    thresholdLine.push({ x: highPoint.x, y: thresholdValue });

    const currentPoint = sortedPoints[i];
    if (currentPoint.y <= thresholdValue) {
      dipEvents.push({ x: highPoint.x, y: currentPoint.y });
    }
  }

  return { recentHighs, thresholdLine, dipEvents };
}
