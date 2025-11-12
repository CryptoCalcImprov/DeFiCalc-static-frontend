import { describe, expect, it } from "vitest";

import type { CoindeskHistoryResult } from "@/lib/coindesk-history";
import {
  computeLogReturns,
  computeRollingHighs,
  computeRollingLows,
  computeSimpleMovingAverage,
  resampleHistory,
  simulateBuyTheDip,
  simulateDcaProjection,
  simulateTrendFollowing,
} from "../index";

const SAMPLE_HISTORY: CoindeskHistoryResult = {
  symbol: "ETH",
  instrument: "ETH-USD",
  market: "cadli",
  startDate: "2024-01-01",
  endDate: "2024-01-10",
  summary: "Sample data",
  dataset: [],
  candles: [
    { date: "2024-01-01", open: 100, high: 110, low: 95, close: 100 },
    { date: "2024-01-02", open: 102, high: 108, low: 98, close: 105 },
    { date: "2024-01-03", open: 106, high: 107, low: 94, close: 98 },
    { date: "2024-01-04", open: 99, high: 112, low: 97, close: 110 },
    { date: "2024-01-05", open: 111, high: 116, low: 109, close: 115 },
    { date: "2024-01-06", open: 114, high: 118, low: 111, close: 112 },
    { date: "2024-01-07", open: 112, high: 122, low: 110, close: 120 },
    { date: "2024-01-08", open: 121, high: 123, low: 115, close: 118 },
    { date: "2024-01-09", open: 117, high: 126, low: 116, close: 125 },
    { date: "2024-01-10", open: 125, high: 132, low: 124, close: 130 },
  ],
};

describe("modeling helpers", () => {
  it("resamples history to requested length", () => {
    const sampled = resampleHistory(SAMPLE_HISTORY, 4);
    expect(sampled).toHaveLength(4);
    expect(sampled[0].date).toBe("2024-01-01");
    expect(sampled[sampled.length - 1].date).toBe("2024-01-10");
  });

  it("computes log returns", () => {
    const returns = computeLogReturns(SAMPLE_HISTORY);
    expect(returns).toHaveLength(SAMPLE_HISTORY.candles.length - 1);
    expect(returns[0]).toBeCloseTo(Math.log(105 / 100));
  });

  it("computes rolling highs and lows", () => {
    const highs = computeRollingHighs(SAMPLE_HISTORY, 3);
    const lows = computeRollingLows(SAMPLE_HISTORY, 3);
    expect(highs[highs.length - 1]).toBe(130);
    expect(lows[lows.length - 1]).toBe(118);
  });

  it("computes simple moving averages", () => {
    const sma = computeSimpleMovingAverage(SAMPLE_HISTORY, 3);
    expect(sma[sma.length - 1]).toBeCloseTo((118 + 125 + 130) / 3);
  });
});

describe("simulateDcaProjection", () => {
  it("generates schedule and projection path", () => {
    const result = simulateDcaProjection(SAMPLE_HISTORY, {
      contributionUsd: 200,
      intervalDays: 7,
      durationDays: 28,
    });

    expect(result.projection.schedule.length).toBeGreaterThan(0);
    expect(result.projection.schedule[0].contribution).toBe(200);
    expect(result.projection.schedule[0].units).toBeGreaterThan(0);
    expect(result.projection.path.length).toBeLessThanOrEqual(50);
    expect(result.metrics.find((metric) => metric.id === "cost_basis")).toBeDefined();
  });
});

describe("simulateBuyTheDip", () => {
  it("identifies triggers and projects windows", () => {
    const result = simulateBuyTheDip(SAMPLE_HISTORY, {
      totalBudgetUsd: 1000,
      dipThreshold: 0.05,
      lookbackWindowDays: 3,
      projectionWindowDays: 60,
    });

    expect(result.projection.triggers.length).toBeGreaterThan(0);
    expect(result.projection.projectedWindows.length).toBeGreaterThan(0);
    expect(result.projection.path.length).toBeLessThanOrEqual(50);
    expect(result.metrics.find((metric) => metric.id === "unallocated_budget")).toBeDefined();
  });
});

describe("simulateTrendFollowing", () => {
  it("produces trend states and equity metrics", () => {
    const result = simulateTrendFollowing(SAMPLE_HISTORY, {
      initialCapitalUsd: 5000,
      shortWindow: 2,
      longWindow: 4,
      projectionWindowDays: 60,
    });

    expect(result.projection.states.length).toBe(SAMPLE_HISTORY.candles.length);
    expect(result.projection.path.length).toBeLessThanOrEqual(50);
    expect(result.metrics.find((metric) => metric.id === "strategy_equity")).toBeDefined();
    expect(result.metrics.find((metric) => metric.id === "hodl_equity")).toBeDefined();
  });
});
