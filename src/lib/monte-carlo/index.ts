import { randomLcg, randomNormal } from "d3-random";
import { mean, standardDeviation } from "simple-statistics";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const MonteCarloHorizons = {
  ONE_MONTH: 1,
  THREE_MONTHS: 3,
  SIX_MONTHS: 6,
  ONE_YEAR: 12,
  TWO_YEARS: 24,
  THREE_YEARS: 36,
} as const;

const VALID_HORIZONS = new Set<number>(Object.values(MonteCarloHorizons));

export type MonteCarloHorizon = (typeof MonteCarloHorizons)[keyof typeof MonteCarloHorizons];

export type MonteCarloConfig = {
  horizonMonths: MonteCarloHorizon;
  stepDays: number;
  seed?: number;
};

export type DriftVolatilityEstimate = {
  drift: number;
  volatility: number;
  sampleCount: number;
};

export type MonteCarloTrajectoryPoint = {
  x: number;
  y: number;
};

export type MonteCarloPathOptions = {
  startPrice: number;
  startTimestamp: number;
  drift: number;
  volatility: number;
  config?: Partial<MonteCarloConfig>;
};

export const defaultMonteCarloConfig: MonteCarloConfig = {
  horizonMonths: MonteCarloHorizons.SIX_MONTHS,
  stepDays: 1,
  seed: 42157,
};

export function buildMonteCarloConfig(overrides?: Partial<MonteCarloConfig>): MonteCarloConfig {
  const horizonMonths =
    typeof overrides?.horizonMonths === "number" && VALID_HORIZONS.has(overrides.horizonMonths)
      ? overrides.horizonMonths
      : defaultMonteCarloConfig.horizonMonths;

  const stepDays = Math.max(1, Math.trunc(overrides?.stepDays ?? defaultMonteCarloConfig.stepDays));

  const seed = overrides?.seed ?? defaultMonteCarloConfig.seed;

  return {
    horizonMonths,
    stepDays,
    seed,
  };
}

export function estimateDriftAndVolatility(prices: number[]): DriftVolatilityEstimate | null {
  const logReturns: number[] = [];
  let previousPrice: number | null = null;

  for (const price of prices) {
    if (!Number.isFinite(price) || price <= 0) {
      continue;
    }

    if (previousPrice !== null) {
      logReturns.push(Math.log(price / previousPrice));
    }

    previousPrice = price;
  }

  if (!logReturns.length) {
    return null;
  }

  return {
    drift: mean(logReturns),
    volatility: standardDeviation(logReturns),
    sampleCount: logReturns.length,
  };
}

function createStandardNormalSampler(seed?: number) {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    const seededSource = randomLcg(seed);
    return randomNormal.source(seededSource)(0, 1);
  }

  return randomNormal(0, 1);
}

export function generateMonteCarloPath(options: MonteCarloPathOptions): MonteCarloTrajectoryPoint[] {
  const { startPrice, startTimestamp, drift, volatility } = options;

  if (!Number.isFinite(startPrice) || startPrice <= 0) {
    return [];
  }

  if (!Number.isFinite(startTimestamp)) {
    return [];
  }

  if (!Number.isFinite(drift) || !Number.isFinite(volatility)) {
    return [];
  }

  const config = buildMonteCarloConfig(options.config);
  const normalizedStepDays = Math.max(1, config.stepDays);
  const steps = Math.max(1, Math.round((config.horizonMonths * 30) / normalizedStepDays));
  const stepMs = normalizedStepDays * MS_PER_DAY;
  const sampler = createStandardNormalSampler(config.seed);

  const trajectory: MonteCarloTrajectoryPoint[] = [];
  let currentTimestamp = startTimestamp;
  let currentPrice = startPrice;

  for (let index = 0; index < steps; index += 1) {
    const noise = sampler();
    const logReturn = drift + volatility * noise;
    currentPrice *= Math.exp(logReturn);
    currentTimestamp += stepMs;
    trajectory.push({ x: currentTimestamp, y: currentPrice });
  }

  return trajectory;
}
