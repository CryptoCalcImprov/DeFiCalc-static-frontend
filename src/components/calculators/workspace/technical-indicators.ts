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

export type ForecastDipSeries = {
  thresholdLine: TechnicalPoint[];
  dipEvents: TechnicalPoint[];
};

/**
 * Detects dips in a forecast context by comparing sample path against forecast mean.
 * Triggers when sample path falls below mean by the threshold percentage.
 */
export function buildForecastDipSeries(
  samplePath: TimeSeriesValuePoint[],
  forecastMean: TimeSeriesValuePoint[],
  thresholdPercent: number,
): ForecastDipSeries {
  const normalizedThreshold = Number.isFinite(thresholdPercent) ? thresholdPercent : 0;
  const thresholdFactor = Math.max(0, normalizedThreshold / 100);
  const thresholdLine: TechnicalPoint[] = [];
  const dipEvents: TechnicalPoint[] = [];

  if (thresholdFactor === 0 || !samplePath.length || !forecastMean.length) {
    return { thresholdLine, dipEvents };
  }

  // Create a map of timestamps to mean values for quick lookup
  const meanMap = new Map<number, number>();
  forecastMean.forEach((point) => {
    meanMap.set(point.x, point.y);
  });

  // Check each sample path point
  for (const point of samplePath) {
    const meanValue = meanMap.get(point.x);
    if (!meanValue || !Number.isFinite(meanValue)) {
      continue;
    }

    const thresholdValue = meanValue * (1 - thresholdFactor);
    thresholdLine.push({ x: point.x, y: thresholdValue });

    // Trigger if sample path is below threshold
    if (point.y <= thresholdValue) {
      dipEvents.push({ x: point.x, y: point.y });
    }
  }

  return { thresholdLine, dipEvents };
}

export type TrendCrossoverSeries = {
  maSeries: TechnicalPoint[];
  buySignals: TechnicalPoint[];
  sellSignals: TechnicalPoint[];
};

/**
 * Detects MA crossovers on a price series.
 * Buy signal: price crosses ABOVE MA
 * Sell signal: price crosses BELOW MA
 */
export function buildMACrossoverSeries(
  priceSeries: TimeSeriesValuePoint[],
  maPeriod: number,
): TrendCrossoverSeries {
  const sortedPoints = sortPoints(priceSeries);
  const maSeries = buildMovingAverageSeries(sortedPoints, maPeriod);
  const buySignals: TechnicalPoint[] = [];
  const sellSignals: TechnicalPoint[] = [];

  if (!maSeries.length) {
    return { maSeries, buySignals, sellSignals };
  }

  // Create a map of timestamps to MA values for quick lookup
  const maMap = new Map<number, number>();
  maSeries.forEach((point) => {
    maMap.set(point.x, point.y);
  });

  let previousPosition: 'above' | 'below' | null = null;

  // Start checking after MA has enough data points
  for (let i = maPeriod - 1; i < sortedPoints.length; i += 1) {
    const currentPoint = sortedPoints[i];
    const maValue = maMap.get(currentPoint.x);

    if (!maValue || !Number.isFinite(maValue)) {
      continue;
    }

    const currentPosition = currentPoint.y > maValue ? 'above' : 'below';

    // Detect crossovers
    if (previousPosition !== null && previousPosition !== currentPosition) {
      if (currentPosition === 'above') {
        // Crossed above = buy signal
        buySignals.push({ x: currentPoint.x, y: currentPoint.y });
      } else {
        // Crossed below = sell signal
        sellSignals.push({ x: currentPoint.x, y: currentPoint.y });
      }
    }

    previousPosition = currentPosition;
  }

  return { maSeries, buySignals, sellSignals };
}
