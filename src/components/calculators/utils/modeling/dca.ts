import type { CoindeskHistoryResult } from "@/lib/coindesk-history";
import { extractCloseSeries, computeLogReturns, buildHistoryStats, addDays, downsampleSeries, hashSymbol, mean, standardDeviation } from "./helpers";
import type {
  DcaAnalysisPackage,
  DcaProjection,
  DcaScheduleEntry,
  DcaSimulationOptions,
  TimeSeriesPoint,
} from "./types";

const MAX_PROJECTION_POINTS = 50;

function buildModulationFactor(symbolHash: number, stepIndex: number, volatility: number) {
  const boundedVol = Math.min(Math.max(volatility, 0), 1.5);
  const amplitude = Math.min(0.35, boundedVol * 0.6);
  const phase = (symbolHash % 360) * (Math.PI / 180);
  return 1 + amplitude * Math.sin(phase + stepIndex * 0.9);
}

function projectPricePath(
  lastPrice: number,
  avgLogReturn: number,
  volatility: number,
  intervalDays: number,
  totalSteps: number,
  symbolHash: number,
): TimeSeriesPoint[] {
  const path: TimeSeriesPoint[] = [];
  let currentPrice = lastPrice;

  for (let i = 1; i <= totalSteps; i++) {
    const drift = avgLogReturn * intervalDays;
    const volShock = volatility * Math.sqrt(intervalDays) * 0.5;
    const baseGrowth = Math.exp(drift - (volatility ** 2 * intervalDays) / 2);
    const modulation = buildModulationFactor(symbolHash, i, volatility + volShock);
    currentPrice = Math.max(0.0001, currentPrice * baseGrowth * modulation);
    path.push({
      date: "",
      price: currentPrice,
    });
  }

  return path;
}

export function simulateDcaProjection(
  history: CoindeskHistoryResult,
  options: DcaSimulationOptions,
): DcaAnalysisPackage {
  const { contributionUsd, intervalDays, durationDays } = options;
  const closeSeries = extractCloseSeries(history);
  const logReturns = computeLogReturns(history);
  const avgLogReturn = logReturns.length ? mean(logReturns) : 0;
  const volatility = logReturns.length ? standardDeviation(logReturns) : 0;

  const steps = Math.max(1, Math.round(durationDays / intervalDays));
  const lastHistoryPoint = closeSeries[closeSeries.length - 1];
  const symbolHash = hashSymbol(history.symbol || history.instrument || "");
  const projectedPath = projectPricePath(
    lastHistoryPoint?.price ?? 1,
    avgLogReturn,
    volatility,
    intervalDays,
    steps,
    symbolHash,
  );

  const schedule: DcaScheduleEntry[] = [];
  let cumulativeUnits = 0;
  let cumulativeCost = 0;
  let cursorDate = history.endDate;

  projectedPath.forEach((point, index) => {
    cursorDate = addDays(history.endDate, intervalDays * (index + 1));
    const price = point.price;
    const contribution = contributionUsd;
    const units = contribution / price;
    cumulativeUnits += units;
    cumulativeCost += contribution;
    const costBasis = cumulativeUnits > 0 ? cumulativeCost / cumulativeUnits : 0;

    schedule.push({
      date: cursorDate,
      price,
      contribution,
      units,
      cumulativeUnits,
      cumulativeCost,
      costBasis,
    });

    point.date = cursorDate;
  });

  const projection: DcaProjection = {
    schedule,
    totalContribution: contributionUsd * schedule.length,
    projectedHoldings: cumulativeUnits,
    projectedValue: cumulativeUnits * (schedule[schedule.length - 1]?.price ?? 0),
    path: downsampleSeries([
      ...closeSeries.slice(-1),
      ...schedule.map((entry) => ({ date: entry.date, price: entry.price })),
    ], MAX_PROJECTION_POINTS),
  };

  const analysisPackage: DcaAnalysisPackage = {
    history: {
      stats: buildHistoryStats(history),
      series: resampleSeriesForHistory(closeSeries),
    },
    projection,
    metrics: [
      {
        id: "total_contribution",
        label: "Total USD deployed",
        value: projection.totalContribution,
      },
      {
        id: "projected_units",
        label: "Projected units accumulated",
        value: projection.projectedHoldings,
      },
      {
        id: "cost_basis",
        label: "Realized cost basis",
        value: schedule[schedule.length - 1]?.costBasis ?? 0,
      },
      {
        id: "projected_value",
        label: "Projected portfolio value",
        value: projection.projectedValue,
      },
    ],
  };

  return analysisPackage;
}

function resampleSeriesForHistory(series: TimeSeriesPoint[]) {
  return downsampleSeries(series, 50);
}
