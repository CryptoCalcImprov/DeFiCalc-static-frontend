import type { ForecastProjectionPoint } from "@/components/calculators/types";

/**
 * Simple seeded random number generator for reproducibility.
 * Uses a linear congruential generator (LCG).
 */
function createSeededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/**
 * Generate a normally distributed random number using Box-Muller transform.
 */
function normalRandom(random: () => number): number {
  const u1 = random();
  const u2 = random();
  return Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2);
}

export type SamplePathPoint = {
  x: number;
  y: number;
};

/**
 * Generates a single sample path that moves within the forecast percentile bounds.
 * Uses a mean-reverting random walk with correlation between steps.
 *
 * @param projection - The forecast projection data with percentile bounds
 * @param startPrice - The starting price (typically last historical close)
 * @param seed - Optional seed for reproducible paths
 * @returns Array of {x, y} points for the sample path
 */
export function generateSamplePath(
  projection: ForecastProjectionPoint[],
  startPrice: number,
  seed = 42,
): SamplePathPoint[] {
  if (!projection.length) {
    return [];
  }

  const random = createSeededRandom(seed);
  const result: SamplePathPoint[] = [];

  // Mean reversion strength (0-1, higher = more pull toward mean)
  const meanReversionStrength = 0.08;
  // Volatility scale for random steps
  const volatilityScale = 1.2;
  // Correlation between steps (momentum factor)
  const momentum = 0.5;

  let currentPrice = startPrice;
  let previousShock = 0;

  for (let i = 0; i < projection.length; i++) {
    const point = projection[i];
    const timestamp = new Date(point.timestamp).getTime();

    if (!Number.isFinite(timestamp)) {
      continue;
    }

    const mean = point.mean;
    const lower = point.percentile_10 ?? mean * 0.7;
    const upper = point.percentile_90 ?? mean * 1.3;
    const range = upper - lower;

    // Generate correlated random shock
    const newShock = normalRandom(random);
    const correlatedShock = momentum * previousShock + Math.sqrt(1 - momentum * momentum) * newShock;
    previousShock = correlatedShock;

    // Mean reversion component
    const meanReversionPull = (mean - currentPrice) * meanReversionStrength;

    // Random walk component scaled by the percentile range
    const randomStep = correlatedShock * range * volatilityScale * 0.025;

    // Update price
    currentPrice = currentPrice + meanReversionPull + randomStep;

    // Soft bounds - allow some overshoot but pull back gently
    const softLower = lower - range * 0.1;
    const softUpper = upper + range * 0.1;

    if (currentPrice < softLower) {
      currentPrice = softLower + (softLower - currentPrice) * 0.3;
    } else if (currentPrice > softUpper) {
      currentPrice = softUpper - (currentPrice - softUpper) * 0.3;
    }

    // Hard clamp as final safety (wider bounds)
    currentPrice = Math.max(lower * 0.9, Math.min(upper * 1.1, currentPrice));

    result.push({
      x: timestamp,
      y: currentPrice,
    });
  }

  return result;
}

