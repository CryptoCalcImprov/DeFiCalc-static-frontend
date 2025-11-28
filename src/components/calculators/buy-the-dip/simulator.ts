import type { CoinGeckoCandle } from "@/components/calculators/types";

export type BuyTheDipSimulationPoint = {
  date: string;
  price: number;
  amount: number;
  quantity: number;
};

export type BuyTheDipSimulationMetrics = {
  totalInvested: number;
  averagePrice: number;
  totalQuantity: number;
  contributions: number;
};

export type BuyTheDipSimulation = {
  points: BuyTheDipSimulationPoint[];
  metrics: BuyTheDipSimulationMetrics;
};

type SimulationParams = {
  projectionCandles: CoinGeckoCandle[];
  dipThresholdPct: number;
  totalBudget: number;
};

export function simulateBuyTheDipStrategy({
  projectionCandles,
  dipThresholdPct,
  totalBudget,
}: SimulationParams): BuyTheDipSimulation {
  if (!projectionCandles.length || !Number.isFinite(dipThresholdPct) || dipThresholdPct <= 0 || totalBudget <= 0) {
    return {
      points: [],
      metrics: {
        totalInvested: 0,
        averagePrice: 0,
        totalQuantity: 0,
        contributions: 0,
      },
    };
  }

  const windowDays = 30;
  const minSpacingDays = 5;

  let lastBuyIndex = -Infinity;

  type Trigger = { date: string; price: number; index: number };
  const triggers: Trigger[] = [];

  projectionCandles.forEach((candle, index) => {
    const price = candle.close;
    const windowStart = Math.max(0, index - windowDays + 1);
    const windowHigh = projectionCandles
      .slice(windowStart, index + 1)
      .reduce((max, c) => (c.close > max ? c.close : max), projectionCandles[windowStart].close);

    const dropPct = windowHigh > 0 ? ((windowHigh - price) / windowHigh) * 100 : 0;
    const spacedEnough = index - lastBuyIndex >= minSpacingDays;

    if (dropPct >= dipThresholdPct && spacedEnough) {
      triggers.push({
        date: candle.date,
        price,
        index,
      });
      lastBuyIndex = index;
    }
  });

  if (!triggers.length) {
    return {
      points: [],
      metrics: {
        totalInvested: 0,
        averagePrice: 0,
        totalQuantity: 0,
        contributions: 0,
      },
    };
  }

  const points: BuyTheDipSimulationPoint[] = [];
  let remainingBudget = totalBudget;

  triggers.forEach((trigger, idx) => {
    if (remainingBudget <= 0) {
      return;
    }
    const contributionsRemaining = triggers.length - idx;
    const baseAllocation = totalBudget / triggers.length;
    const amount =
      contributionsRemaining === 1 ? remainingBudget : Math.min(baseAllocation, remainingBudget);
    remainingBudget = Math.max(0, remainingBudget - amount);
    const quantity = trigger.price > 0 ? amount / trigger.price : 0;
    points.push({
      date: trigger.date,
      price: trigger.price,
      amount,
      quantity,
    });
  });

  const totalInvested = points.reduce((sum, point) => sum + point.amount, 0);
  const totalQuantity = points.reduce((sum, point) => sum + point.quantity, 0);
  const averagePrice = totalQuantity > 0 ? totalInvested / totalQuantity : 0;

  return {
    points,
    metrics: {
      totalInvested,
      averagePrice,
      totalQuantity,
      contributions: points.length,
    },
  };
}
