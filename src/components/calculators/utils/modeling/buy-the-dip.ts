import type { CoindeskHistoryResult } from "@/lib/coindesk-history";
import {
  addDays,
  buildHistoryStats,
  computeRollingHighs,
  computeRollingLows,
  computeLogReturns,
  downsampleSeries,
  extractCloseSeries,
  mean,
} from "./helpers";
import type {
  BuyTheDipAnalysisPackage,
  BuyTheDipProjection,
  BuyTheDipSimulationOptions,
  DipTrigger,
  DipWindow,
  TimeSeriesPoint,
} from "./types";

const MAX_PROJECTION_POINTS = 50;

function identifyDipTriggers(
  history: CoindeskHistoryResult,
  options: BuyTheDipSimulationOptions,
): DipTrigger[] {
  const rollingHighs = computeRollingHighs(history, options.lookbackWindowDays);
  const closes = extractCloseSeries(history);
  const triggers: DipTrigger[] = [];

  closes.forEach((point, index) => {
    const drawdown = rollingHighs[index] ? (point.price - rollingHighs[index]) / rollingHighs[index] : 0;
    if (drawdown <= -options.dipThreshold) {
      triggers.push({
        date: point.date,
        drawdown: Math.abs(drawdown),
        price: point.price,
      });
    }
  });

  return triggers;
}

function buildProjectionPath(
  history: CoindeskHistoryResult,
  triggers: DipTrigger[],
  projectionWindowDays: number,
): TimeSeriesPoint[] {
  const closes = extractCloseSeries(history);
  const lastPrice = closes[closes.length - 1]?.price ?? 1;
  const lastDate = history.endDate;
  const forwardPoints: TimeSeriesPoint[] = [];
  const baseDrift = mean(computeLogReturns(history));
  const dipInfluence = triggers.length ? mean(triggers.map((trigger) => trigger.drawdown)) : 0.05;
  const stepDays = Math.max(7, Math.round(projectionWindowDays / 12));
  const totalSteps = Math.max(1, Math.round(projectionWindowDays / stepDays));

  let cursorPrice = lastPrice;
  let cursorDate = lastDate;

  for (let i = 1; i <= totalSteps; i++) {
    cursorDate = addDays(lastDate, stepDays * i);
    const seasonalDip = dipInfluence * Math.sin(i * Math.PI * 0.5);
    const growth = Math.exp(baseDrift * stepDays);
    cursorPrice = Math.max(0.0001, cursorPrice * growth * (1 - seasonalDip));
    forwardPoints.push({
      date: cursorDate,
      price: cursorPrice,
    });
  }

  return forwardPoints;
}

function projectDipWindows(
  lastDate: string,
  triggers: DipTrigger[],
  options: BuyTheDipSimulationOptions,
): DipWindow[] {
  if (!triggers.length) {
    return [
      {
        windowStart: addDays(lastDate, Math.max(7, Math.round(options.projectionWindowDays / 4))),
        windowEnd: addDays(lastDate, options.projectionWindowDays),
        allocation: options.totalBudgetUsd,
        expectedPrice: 0,
      },
    ];
  }

  const intervals: number[] = [];
  for (let i = 1; i < triggers.length; i++) {
    const prev = new Date(`${triggers[i - 1].date}T00:00:00Z`).getTime();
    const next = new Date(`${triggers[i].date}T00:00:00Z`).getTime();
    const deltaDays = Math.max(1, Math.round((next - prev) / (1000 * 60 * 60 * 24)));
    intervals.push(deltaDays);
  }
  const averageInterval = intervals.length ? Math.round(mean(intervals)) : Math.max(14, options.lookbackWindowDays / 2);
  const projectedCount = Math.max(1, Math.min(3, Math.floor(options.projectionWindowDays / averageInterval)));
  const allocationPerWindow = options.totalBudgetUsd / projectedCount;

  const windows: DipWindow[] = [];
  for (let i = 1; i <= projectedCount; i++) {
    const startOffset = averageInterval * i;
    const endOffset = Math.round(startOffset * 1.2);
    windows.push({
      windowStart: addDays(lastDate, startOffset),
      windowEnd: addDays(lastDate, endOffset),
      allocation: allocationPerWindow,
      expectedPrice: triggers[triggers.length - 1]?.price * (1 - options.dipThreshold) ?? 0,
    });
  }

  return windows;
}

export function simulateBuyTheDip(
  history: CoindeskHistoryResult,
  options: BuyTheDipSimulationOptions,
): BuyTheDipAnalysisPackage {
  const triggers = identifyDipTriggers(history, options);
  const projectionPath = buildProjectionPath(history, triggers, options.projectionWindowDays);
  const windows = projectDipWindows(history.endDate, triggers, options);
  const remainingBudget = Math.max(0, options.totalBudgetUsd - windows.reduce((acc, window) => acc + window.allocation, 0));

  const projection: BuyTheDipProjection = {
    triggers,
    projectedWindows: windows,
    remainingBudget,
    path: downsampleSeries(
      [
        ...extractCloseSeries(history).slice(-1),
        ...projectionPath,
      ],
      MAX_PROJECTION_POINTS,
    ),
  };

  const rollingLows = computeRollingLows(history, options.lookbackWindowDays);
  const avgDrawdown = triggers.length ? mean(triggers.map((trigger) => trigger.drawdown)) : 0;

  return {
    history: {
      stats: buildHistoryStats(history),
      series: downsampleSeries(extractCloseSeries(history), 50),
    },
    projection,
    metrics: [
      {
        id: "trigger_count",
        label: "Historical dip triggers",
        value: triggers.length,
      },
      {
        id: "average_drawdown",
        label: "Average drawdown",
        value: avgDrawdown,
      },
      {
        id: "recent_support",
        label: "Recent rolling low",
        value: rollingLows[rollingLows.length - 1] ?? 0,
      },
      {
        id: "unallocated_budget",
        label: "Budget remaining",
        value: remainingBudget,
      },
    ],
  };
}
