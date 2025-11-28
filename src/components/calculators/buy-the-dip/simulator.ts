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

  const estimatedDurationDays = projectionCandles.length;
  const windowDays = Math.max(20, Math.min(60, Math.round(estimatedDurationDays / 6) || 30));
  const minSpacingDays = Math.max(3, Math.round(windowDays / 6));

  let lastBuyIndex = -Infinity;
  let lookbackAnchorIndex = 0;
  let previousPrice = projectionCandles[0]?.close ?? 0;

  type Trigger = {
    date: string;
    price: number;
    index: number;
    dropPct: number;
    daysSinceLastBuy: number;
    severityScore: number;
  };
  const triggers: Trigger[] = [];

  projectionCandles.forEach((candle, index) => {
    const price = candle.close;
    const windowStart = Math.max(lookbackAnchorIndex, index - windowDays + 1);
    const slice = projectionCandles.slice(windowStart, index + 1);
    if (!slice.length) {
      previousPrice = price;
      return;
    }

    const windowHigh = slice.reduce((max, c) => (c.close > max ? c.close : max), slice[0].close);
    const dropPct = windowHigh > 0 ? ((windowHigh - price) / windowHigh) * 100 : 0;
    const thresholdFactor = Math.max(0, dipThresholdPct) / 100;
    const thresholdValue = windowHigh * (1 - thresholdFactor);
    const crossedBelow = price <= thresholdValue && previousPrice > thresholdValue;
    const downwardMomentum = price < previousPrice;
    const spacedEnough = index - lastBuyIndex >= minSpacingDays;

    if (crossedBelow && downwardMomentum && spacedEnough) {
      const severity = Math.max(0, dropPct - dipThresholdPct);
      const daysSinceLast = lastBuyIndex === -Infinity ? index : index - lastBuyIndex;
      triggers.push({
        date: candle.date,
        price,
        index,
        dropPct,
        daysSinceLastBuy: daysSinceLast,
        severityScore: severity,
      });
      lastBuyIndex = index;
      lookbackAnchorIndex = index;
    }

    previousPrice = price;
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

  const defaultThreshold = Math.max(1, dipThresholdPct);

  const weightedTriggers = triggers.map((trigger) => {
    const severityWeight = 1 + trigger.severityScore / defaultThreshold;
    const timeWeight =
      trigger.daysSinceLastBuy > minSpacingDays
        ? 1 + (trigger.daysSinceLastBuy - minSpacingDays) / Math.max(1, windowDays)
        : 1;
    return {
      ...trigger,
      weight: severityWeight * timeWeight,
    };
  });

  const totalWeight = weightedTriggers.reduce((sum, trigger) => sum + trigger.weight, 0);
  const normalizedTotalWeight = totalWeight > 0 ? totalWeight : weightedTriggers.length;

  const points: BuyTheDipSimulationPoint[] = [];
  let remainingBudget = totalBudget;

  weightedTriggers.forEach((trigger, idx) => {
    if (remainingBudget <= 0) {
      return;
    }
    const contributionsRemaining = weightedTriggers.length - idx;
    const proportionalAmount = (totalBudget * trigger.weight) / normalizedTotalWeight;
    const amount =
      contributionsRemaining === 1 ? remainingBudget : Math.min(proportionalAmount, remainingBudget);
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
