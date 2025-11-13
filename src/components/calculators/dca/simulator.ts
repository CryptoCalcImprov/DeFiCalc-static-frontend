export type DcaSimulationPoint = {
  date: string;
  price: number;
  amount: number;
  quantity: number;
};

export type DcaSimulationMetrics = {
  totalInvested: number;
  averagePrice: number;
  totalQuantity: number;
  intervalDays: number;
  contributions: number;
};

export type DcaSimulation = {
  points: DcaSimulationPoint[];
  metrics: DcaSimulationMetrics;
};

const MS_PER_DAY = 86_400_000;

type SimulationParams = {
  projectionSeries: { timestamp: number; price: number; date: string }[];
  amountPerContribution: number;
  intervalDays: number;
  durationMonths: number;
};

function findEntry(series: SimulationParams["projectionSeries"], target: number) {
  if (!series.length) {
    return null;
  }
  for (const entry of series) {
    if (entry.timestamp >= target) {
      return entry;
    }
  }
  return series[series.length - 1];
}

export function simulateDcaStrategy({
  projectionSeries,
  amountPerContribution,
  intervalDays,
  durationMonths,
}: SimulationParams): DcaSimulation {
  if (
    amountPerContribution <= 0 ||
    intervalDays <= 0 ||
    durationMonths <= 0 ||
    !projectionSeries.length
  ) {
    return {
      points: [],
      metrics: {
        totalInvested: 0,
        averagePrice: 0,
        totalQuantity: 0,
        intervalDays,
        contributions: 0,
      },
    };
  }

  const durationMs = durationMonths * 30 * MS_PER_DAY;
  const intervalMs = intervalDays * MS_PER_DAY;
  const contributions = Math.max(1, Math.floor(durationMs / intervalMs));
  const points: DcaSimulationPoint[] = [];
  const startTs = projectionSeries[0].timestamp;
  let totalQuantity = 0;

  for (let i = 0; i < contributions; i += 1) {
    const targetTs = startTs + i * intervalMs;
    const entry = findEntry(projectionSeries, targetTs);
    if (!entry) {
      break;
    }
    const quantity = entry.price > 0 ? amountPerContribution / entry.price : 0;
    points.push({
      date: entry.date,
      price: entry.price,
      amount: amountPerContribution,
      quantity,
    });
    totalQuantity += quantity;
  }

  const totalInvested = amountPerContribution * points.length;
  const averagePrice = totalQuantity > 0 ? totalInvested / totalQuantity : 0;

  return {
    points,
    metrics: {
      totalInvested,
      averagePrice,
      totalQuantity,
      intervalDays,
      contributions: points.length,
    },
  };
}
