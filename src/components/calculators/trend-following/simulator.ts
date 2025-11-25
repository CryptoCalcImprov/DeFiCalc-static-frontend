import type { ChartProjectionData } from "@/components/calculators/types";
import type {
  TrendFollowingCrossoverPoint,
  TrendFollowingDataPoint,
  TrendFollowingSimulation,
} from "@/components/calculators/trend-following/types";

type SimulationParams = {
  chartProjection: ChartProjectionData;
  initialCapital: number;
  maPeriod: number;
};

function formatDateFromTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function buildCombinedSeries(chartProjection: ChartProjectionData) {
  const historical = chartProjection.historical_data
    .map((candle) => ({
      timestamp: new Date(candle.date).getTime(),
      date: candle.date,
      price: candle.close,
    }))
    .filter((item) => Number.isFinite(item.timestamp) && Number.isFinite(item.price));

  const projection = chartProjection.projection
    .map((point) => ({
      timestamp: new Date(point.timestamp).getTime(),
      date: formatDateFromTimestamp(new Date(point.timestamp).getTime()),
      price: point.mean,
    }))
    .filter((item) => Number.isFinite(item.timestamp) && Number.isFinite(item.price));

  const combined = [...historical, ...projection];
  combined.sort((a, b) => a.timestamp - b.timestamp);
  return combined;
}

export function simulateTrendFollowingStrategy({
  chartProjection,
  initialCapital,
  maPeriod,
}: SimulationParams): TrendFollowingSimulation {
  const combinedSeries = buildCombinedSeries(chartProjection);
  if (!combinedSeries.length || !Number.isFinite(initialCapital) || initialCapital <= 0) {
    return {
      dataset: [],
      crossovers: [],
      metrics: {
        totalReturnPct: 0,
        sharpe: 0,
        maxDrawdownPct: 0,
        timeInMarketPct: 0,
        crossoverCount: 0,
      },
    };
  }

  const closes: number[] = [];
  const dataset: TrendFollowingDataPoint[] = [];
  const crossovers: TrendFollowingCrossoverPoint[] = [];
  const returns: number[] = [];

  let cash = initialCapital;
  let btcUnits = 0;
  let position = 0; // 1 => long BTC, 0 => stablecoin
  let prevEquity = initialCapital;
  let peakEquity = initialCapital;
  let maxDrawdown = 0;
  let timeInMarketCount = 0;

  const firstPrice = combinedSeries[0].price;
  const hodlUnits = firstPrice > 0 ? initialCapital / firstPrice : 0;

  combinedSeries.forEach((point, index) => {
    closes.push(point.price);
    const windowStart = Math.max(0, closes.length - maPeriod);
    const window = closes.slice(windowStart);
    const ma = window.reduce((sum, value) => sum + value, 0) / window.length;

    const targetPosition = point.price > ma ? 1 : 0;
    let updatedCash = cash;
    let updatedBtcUnits = btcUnits;

    if (targetPosition !== position) {
      if (targetPosition === 1) {
        // Enter long
        if (updatedCash > 0 && point.price > 0) {
          updatedBtcUnits = updatedCash / point.price;
          updatedCash = 0;
        }
      } else {
        // Exit to stablecoin
        updatedCash = updatedBtcUnits * point.price;
        updatedBtcUnits = 0;
      }

      crossovers.push({
        date: point.date,
        price: point.price,
      });
    }

    const equity = targetPosition === 1 ? updatedBtcUnits * point.price : updatedCash;
    const hodlValue = hodlUnits * point.price;

    if (position === 1) {
      timeInMarketCount += 1;
    }

    if (index > 0 && prevEquity > 0) {
      const periodReturn = (equity - prevEquity) / prevEquity;
      returns.push(periodReturn);
    }

    peakEquity = Math.max(peakEquity, equity);
    const drawdown = peakEquity > 0 ? (equity - peakEquity) / peakEquity : 0;
    maxDrawdown = Math.min(maxDrawdown, drawdown);

    dataset.push({
      date: point.date,
      price: point.price,
      ma,
      portfolioEquity: equity,
      hodlValue,
    });

    prevEquity = equity;
    cash = updatedCash;
    btcUnits = updatedBtcUnits;
    position = targetPosition;
  });

  const finalEquity = dataset.at(-1)?.portfolioEquity ?? initialCapital;
  const totalReturnPct = ((finalEquity / initialCapital) - 1) * 100;
  const timeInMarketPct = dataset.length ? (timeInMarketCount / dataset.length) * 100 : 0;
  const crossoverCount = crossovers.length;
  const maxDrawdownPct = maxDrawdown * 100;

  let sharpe = 0;
  if (returns.length) {
    const avg = returns.reduce((sum, value) => sum + value, 0) / returns.length;
    const variance =
      returns.reduce((sum, value) => sum + (value - avg) * (value - avg), 0) / returns.length;
    const stdDev = Math.sqrt(Math.max(variance, 0));
    if (stdDev > 0) {
      sharpe = (avg / stdDev) * Math.sqrt(252);
    }
  }

  return {
    dataset,
    crossovers,
    metrics: {
      totalReturnPct,
      sharpe,
      maxDrawdownPct,
      timeInMarketPct,
      crossoverCount,
    },
  };
}
