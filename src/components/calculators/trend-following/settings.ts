const DEFAULT_DURATION = "1 year";
const ALL_MA_OPTIONS = [
  { value: "20", label: "20-day MA" },
  { value: "63", label: "63-day MA" },
  { value: "126", label: "126-day MA" },
  { value: "252", label: "252-day MA" },
] as const;

const DURATION_TO_ALLOWED_MA: Record<string, string[]> = {
  "1 month": ["20"],
  "3 months": ["20", "63"],
  "6 months": ["20", "63", "126"],
  "1 year": ["20", "63", "126", "252"],
};

function normalizeDurationKey(duration?: string) {
  if (typeof duration !== "string") {
    return DEFAULT_DURATION;
  }

  const normalized = duration.trim().toLowerCase();
  return Object.keys(DURATION_TO_ALLOWED_MA).find((key) => key.toLowerCase() === normalized) ?? DEFAULT_DURATION;
}

export const TREND_MA_OPTIONS = ALL_MA_OPTIONS;

export function getAllowedTrendMaPeriods(duration?: string): string[] {
  const durationKey = normalizeDurationKey(duration);
  return DURATION_TO_ALLOWED_MA[durationKey] ?? ALL_MA_OPTIONS.map((option) => option.value);
}

export function getDefaultTrendMaPeriod(duration?: string): string {
  const allowed = getAllowedTrendMaPeriods(duration);
  return allowed[allowed.length - 1] ?? ALL_MA_OPTIONS[ALL_MA_OPTIONS.length - 1].value;
}

export function normalizeTrendMaPeriodValue(rawValue: unknown, duration?: string): number {
  const allowed = getAllowedTrendMaPeriods(duration);
  const parsedNumber =
    typeof rawValue === "number"
      ? rawValue
      : typeof rawValue === "string"
        ? Number(rawValue)
        : NaN;

  const normalizedValue = Number.isFinite(parsedNumber) ? Math.round(parsedNumber) : NaN;
  const normalizedKey = Number.isFinite(normalizedValue) ? String(normalizedValue) : null;

  if (normalizedKey && allowed.includes(normalizedKey)) {
    return normalizedValue as number;
  }

  return Number(getDefaultTrendMaPeriod(duration));
}
