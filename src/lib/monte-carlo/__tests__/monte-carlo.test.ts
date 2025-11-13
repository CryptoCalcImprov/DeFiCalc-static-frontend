import { describe, expect, it } from "vitest";
import {
  estimateDriftAndVolatility,
  generateMonteCarloPath,
  MonteCarloHorizons,
} from "../index";

const toLogReturns = (prices: number[]) => {
  const logReturns: number[] = [];
  for (let i = 1; i < prices.length; i += 1) {
    logReturns.push(Math.log(prices[i] / prices[i - 1]));
  }
  return logReturns;
};

const computeVariance = (values: number[]) => {
  const meanValue = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - meanValue, 2), 0) / values.length;
  return variance;
};

describe("estimateDriftAndVolatility", () => {
  it("derives log-return drift and volatility", () => {
    const closes = [100, 105, 110, 120];
    const result = estimateDriftAndVolatility(closes);
    expect(result).not.toBeNull();

    const logReturns = toLogReturns(closes);
    const expectedDrift = logReturns.reduce((sum, value) => sum + value, 0) / logReturns.length;
    const expectedVolatility = Math.sqrt(computeVariance(logReturns));

    expect(result?.drift).toBeCloseTo(expectedDrift, 10);
    expect(result?.volatility).toBeCloseTo(expectedVolatility, 10);
    expect(result?.sampleCount).toBe(logReturns.length);
  });
});

describe("generateMonteCarloPath", () => {
  it("reproduces the same trajectory for a given seed", () => {
    const closes = [120, 123, 130, 128, 135];
    const estimate = estimateDriftAndVolatility(closes);
    expect(estimate).not.toBeNull();

    const config = {
      horizonMonths: MonteCarloHorizons.THREE_MONTHS,
      stepDays: 30,
      seed: 999,
    };

    const timestamp = Date.UTC(2024, 0, 1);

    const firstPath = generateMonteCarloPath({
      startPrice: closes[closes.length - 1],
      startTimestamp: timestamp,
      drift: estimate!.drift,
      volatility: estimate!.volatility,
      config,
    });

    const secondPath = generateMonteCarloPath({
      startPrice: closes[closes.length - 1],
      startTimestamp: timestamp,
      drift: estimate!.drift,
      volatility: estimate!.volatility,
      config,
    });

    expect(firstPath).toEqual(secondPath);
    expect(firstPath.length).toBeGreaterThan(0);
  });
});
