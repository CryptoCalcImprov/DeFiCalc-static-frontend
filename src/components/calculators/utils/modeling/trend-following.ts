import type { CoindeskHistoryResult } from "@/lib/coindesk-history";
import {
  addDays,
  buildHistoryStats,
  computeSimpleMovingAverage,
  computeLogReturns,
  downsampleSeries,
  extractCloseSeries,
  mean,
} from "./helpers";
import type {
  TimeSeriesPoint,
  TrendFollowingAnalysisPackage,
  TrendFollowingSimulationOptions,
  TrendProjection,
  TrendState,
} from "./types";

const MAX_PROJECTION_POINTS = 50;

function deriveTrendStates(
  history: CoindeskHistoryResult,
  options: TrendFollowingSimulationOptions,
): TrendState[] {
  const shortMa = computeSimpleMovingAverage(history, options.shortWindow);
  const longMa = computeSimpleMovingAverage(history, options.longWindow);
  const closes = extractCloseSeries(history);
  const states: TrendState[] = [];

  closes.forEach((point, index) => {
    const shortValue = shortMa[index] ?? null;
    const longValue = longMa[index] ?? null;
    const position = shortValue !== null && longValue !== null && shortValue > longValue ? "long" : "flat";
    states.push({
      date: point.date,
      shortMa: shortValue,
      longMa: longValue,
      position,
    });
  });

  return states;
}

function simulateTrendEquity(
  history: CoindeskHistoryResult,
  states: TrendState[],
  initialCapital: number,
) {
  const closes = extractCloseSeries(history);
  if (!closes.length) {
    return {
      strategyEquity: initialCapital,
      hodlEquity: initialCapital,
    };
  }

  let unitsHeld = initialCapital / closes[0].price;
  let strategyUnits = unitsHeld;
  let strategyCash = 0;

  states.forEach((state, index) => {
    const price = closes[index]?.price ?? closes[closes.length - 1].price;
    if (!price) {
      return;
    }

    if (state.position === "long" && strategyUnits === 0) {
      strategyUnits = strategyCash / price;
      strategyCash = 0;
    }

    if (state.position === "flat" && strategyUnits > 0) {
      strategyCash += strategyUnits * price;
      strategyUnits = 0;
    }
  });

  const lastPrice = closes[closes.length - 1].price;
  const strategyEquity = strategyCash + strategyUnits * lastPrice;
  const hodlEquity = unitsHeld * lastPrice;

  return { strategyEquity, hodlEquity };
}

function extendForwardPath(
  history: CoindeskHistoryResult,
  options: TrendFollowingSimulationOptions,
  states: TrendState[],
): TimeSeriesPoint[] {
  const closes = extractCloseSeries(history);
  const lastPrice = closes[closes.length - 1]?.price ?? 1;
  const baseDrift = mean(computeLogReturns(history));
  const lastState = states[states.length - 1];
  const bias = lastState?.position === "long" ? 1.1 : 0.9;

  const stepDays = Math.max(7, Math.round(options.projectionWindowDays / 12));
  const steps = Math.max(1, Math.round(options.projectionWindowDays / stepDays));

  const path: TimeSeriesPoint[] = [];
  let currentPrice = lastPrice;

  for (let i = 1; i <= steps; i++) {
    const drift = Math.exp(baseDrift * stepDays);
    currentPrice = Math.max(0.0001, currentPrice * drift * Math.pow(bias, 1 / steps));
    path.push({
      date: addDays(history.endDate, stepDays * i),
      price: currentPrice,
    });
  }

  return path;
}

export function simulateTrendFollowing(
  history: CoindeskHistoryResult,
  options: TrendFollowingSimulationOptions,
): TrendFollowingAnalysisPackage {
  const states = deriveTrendStates(history, options);
  const equity = simulateTrendEquity(history, states, options.initialCapitalUsd);
  const forwardPath = extendForwardPath(history, options, states);

  const projection: TrendProjection = {
    states,
    strategyEquity: equity.strategyEquity,
    hodlEquity: equity.hodlEquity,
    path: downsampleSeries(
      [
        ...extractCloseSeries(history).slice(-1),
        ...forwardPath,
      ],
      MAX_PROJECTION_POINTS,
    ),
  };

  return {
    history: {
      stats: buildHistoryStats(history),
      series: downsampleSeries(extractCloseSeries(history), 50),
    },
    projection,
    metrics: [
      {
        id: "strategy_equity",
        label: "Trend strategy equity",
        value: equity.strategyEquity,
      },
      {
        id: "hodl_equity",
        label: "HODL equity",
        value: equity.hodlEquity,
      },
      {
        id: "signal_bias",
        label: "Latest signal",
        value: states[states.length - 1]?.position === "long" ? 1 : 0,
      },
    ],
  };
}
