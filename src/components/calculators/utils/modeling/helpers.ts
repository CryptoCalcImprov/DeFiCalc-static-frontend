import type { CoindeskHistoryResult } from "@/lib/coindesk-history";
import type { TimeSeriesPoint } from "@/components/calculators/types";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parseUtcDate(input: string) {
  return new Date(`${input}T00:00:00Z`);
}

export function addDays(baseDate: string, days: number) {
  const date = parseUtcDate(baseDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function extractCloseSeries(history: CoindeskHistoryResult): TimeSeriesPoint[] {
  return history.candles.map((candle) => ({
    date: candle.date,
    price: candle.close,
  }));
}

export function resampleHistory(
  history: CoindeskHistoryResult,
  targetPoints: number,
): TimeSeriesPoint[] {
  const series = extractCloseSeries(history);
  if (!series.length) {
    return [];
  }

  const clampedTarget = clamp(Math.floor(targetPoints), 1, series.length);
  if (clampedTarget === series.length) {
    return series.slice();
  }

  if (clampedTarget === 1) {
    return [series[series.length - 1]];
  }

  const step = (series.length - 1) / (clampedTarget - 1);
  const result: TimeSeriesPoint[] = [];

  for (let i = 0; i < clampedTarget; i++) {
    const index = Math.round(i * step);
    result.push(series[index]);
  }

  return result;
}

export function computeLogReturns(history: CoindeskHistoryResult): number[] {
  const series = extractCloseSeries(history);
  const returns: number[] = [];

  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1].price;
    const next = series[i].price;
    if (prev > 0 && next > 0) {
      returns.push(Math.log(next / prev));
    }
  }

  return returns;
}

function rollingStatistic(
  values: number[],
  window: number,
  reducer: (slice: number[]) => number,
) {
  const result: number[] = [];
  const effectiveWindow = Math.max(1, Math.floor(window));

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - effectiveWindow + 1);
    const slice = values.slice(start, i + 1);
    result.push(reducer(slice));
  }

  return result;
}

export function computeRollingHighs(history: CoindeskHistoryResult, window: number) {
  const closes = extractCloseSeries(history).map((point) => point.price);
  return rollingStatistic(closes, window, (slice) => Math.max(...slice));
}

export function computeRollingLows(history: CoindeskHistoryResult, window: number) {
  const closes = extractCloseSeries(history).map((point) => point.price);
  return rollingStatistic(closes, window, (slice) => Math.min(...slice));
}

export function computeSimpleMovingAverage(
  history: CoindeskHistoryResult,
  window: number,
) {
  const closes = extractCloseSeries(history).map((point) => point.price);
  return rollingStatistic(closes, window, (slice) => {
    const sum = slice.reduce((acc, value) => acc + value, 0);
    return sum / slice.length;
  });
}

export function mean(values: number[]) {
  if (!values.length) {
    return 0;
  }
  const total = values.reduce((acc, value) => acc + value, 0);
  return total / values.length;
}

export function standardDeviation(values: number[]) {
  if (values.length <= 1) {
    return 0;
  }
  const avg = mean(values);
  const variance =
    values.reduce((acc, value) => acc + (value - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function estimateAnnualizedDrift(logReturns: number[], periodsPerYear = 365) {
  return mean(logReturns) * periodsPerYear;
}

export function estimateAnnualizedVolatility(logReturns: number[], periodsPerYear = 365) {
  return standardDeviation(logReturns) * Math.sqrt(periodsPerYear);
}

export function buildHistoryStats(history: CoindeskHistoryResult) {
  const series = extractCloseSeries(history);
  const logReturns = computeLogReturns(history);
  const stats = {
    startDate: history.startDate,
    endDate: history.endDate,
    sampleCount: series.length,
    totalReturn:
      series.length > 1
        ? (series[series.length - 1].price - series[0].price) / series[0].price
        : 0,
    annualizedDrift: estimateAnnualizedDrift(logReturns),
    annualizedVolatility: estimateAnnualizedVolatility(logReturns),
  };

  return stats;
}

export function downsampleSeries(points: TimeSeriesPoint[], targetPoints: number) {
  if (!points.length) {
    return [];
  }
  const clampedTarget = clamp(Math.floor(targetPoints), 1, points.length);
  if (clampedTarget === points.length) {
    return points.slice();
  }
  if (clampedTarget === 1) {
    return [points[points.length - 1]];
  }

  const step = (points.length - 1) / (clampedTarget - 1);
  const result: TimeSeriesPoint[] = [];

  for (let i = 0; i < clampedTarget; i++) {
    const index = Math.round(i * step);
    result.push(points[index]);
  }

  return result;
}

export function hashSymbol(symbol: string) {
  return symbol
    .trim()
    .toUpperCase()
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
}
