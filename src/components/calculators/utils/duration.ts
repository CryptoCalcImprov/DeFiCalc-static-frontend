const DURATION_MATCHER = /(\d+(?:\.\d+)?)\s*(year|month|week|day)s?/;

/**
 * Converts human-friendly duration labels into day counts, with fallbacks.
 */
export function resolveDurationDays(
  duration: string,
  presetMap: Record<string, number>,
  fallbackDays: number,
) {
  const normalized = duration?.trim().toLowerCase();
  if (normalized && presetMap[normalized] !== undefined) {
    return presetMap[normalized];
  }

  const match = normalized?.match(DURATION_MATCHER);
  if (match) {
    const value = Number(match[1]);
    const unit = match[2] as "year" | "month" | "week" | "day";

    if (!Number.isNaN(value)) {
      const unitMultiplier: Record<typeof unit, number> = {
        year: 365,
        month: 30,
        week: 7,
        day: 1,
      };

      return Math.round(value * unitMultiplier[unit]);
    }
  }

  return fallbackDays;
}
