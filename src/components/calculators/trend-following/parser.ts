import type { TrendFollowingDataPoint } from "./trend-following-chart";
import { extractBalancedJsonObject } from "@/components/calculators/utils/json";

const DATA_LABEL_PATTERN = /DATA:\s*$/i;
const SUMMARY_LABEL_PATTERN = /SUMMARY:\s*/i;

export type TrendFollowingResult = {
  summary: string;
  dataset: TrendFollowingDataPoint[];
};

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parsePoint(candidate: unknown): TrendFollowingDataPoint | null {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const item = candidate as Record<string, unknown>;

  const date = typeof item.date === "string" ? item.date : "";
  const price = parseNumber(item.price);
  const ma = parseNumber(item.ma ?? item.movingAverage);
  const portfolioEquity = parseNumber(item.portfolioEquity ?? item.portfolio_equity);
  const hodlValue = parseNumber(item.hodlValue ?? item.hodl_value);

  if (!date || price == null || ma == null || portfolioEquity == null || hodlValue == null) {
    return null;
  }

  return {
    date,
    price,
    ma,
    portfolioEquity,
    hodlValue,
  };
}

function parseSeriesCollection(series: unknown): TrendFollowingDataPoint[] {
  if (!Array.isArray(series)) {
    return [];
  }

  for (const entry of series) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const record = entry as Record<string, unknown>;
    const rawPoints = Array.isArray(record.points)
      ? record.points
      : Array.isArray(record.data)
        ? record.data
        : null;

    if (!rawPoints) {
      continue;
    }

    const points = rawPoints.map((point) => parsePoint(point)).filter(Boolean) as TrendFollowingDataPoint[];
    if (points.length) {
      return points;
    }
  }

  return [];
}

function parseStructuredReply(reply: string): TrendFollowingResult | null {
  const candidate = extractBalancedJsonObject(reply) ?? reply;

  try {
    const parsed = JSON.parse(candidate) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const dataset = parseSeriesCollection(parsed.series);
    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";

    if (dataset.length === 0) {
      return { summary, dataset: [] };
    }

    return { summary, dataset };
  } catch (error) {
    return null;
  }
}

/**
 * Extracts structured trend-following data from Nova's reply. Supports both the new JSON insight schema
 * and the legacy SUMMARY/DATA response.
 */
export function parseTrendFollowingReply(reply: string): TrendFollowingResult {
  const normalizedReply = reply?.trim() ?? "";

  if (!normalizedReply) {
    return {
      summary: "",
      dataset: [],
    };
  }

  const structured = parseStructuredReply(normalizedReply);
  if (structured) {
    return structured;
  }

  // Legacy fallback: SUMMARY/DATA format
  const jsonStart = normalizedReply.indexOf("[");
  const jsonEnd = normalizedReply.lastIndexOf("]");

  let summary = normalizedReply.trim();
  let dataset: TrendFollowingDataPoint[] = [];

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    summary = normalizedReply
      .slice(0, jsonStart)
      .replace(DATA_LABEL_PATTERN, "")
      .replace(SUMMARY_LABEL_PATTERN, "")
      .trim();
    const jsonString = normalizedReply.slice(jsonStart, jsonEnd + 1);

    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        dataset = parsed.map((item) => parsePoint(item)).filter(Boolean) as TrendFollowingDataPoint[];
      }
    } catch (error) {
      console.warn("[trend-following-parser] Failed to parse DATA block", error);
    }
  }

  if (!summary) {
    summary = "Nova did not return a summary for this scenario.";
  }

  return { summary, dataset };
}
