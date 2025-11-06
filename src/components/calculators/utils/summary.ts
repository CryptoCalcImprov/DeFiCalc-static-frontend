import type {
  CalculatorInsight,
  CalculatorResult,
  CalculatorSummaryMetric,
  CalculatorSummarySection,
  TimeSeriesPoint,
} from "@/components/calculators/types";

const DATA_LABEL_PATTERN = /DATA:\s*$/i;
const SUMMARY_LABEL_PATTERN = /SUMMARY:\s*/i;

type JsonLike = Record<string, unknown>;

function tryParseJson(input: string, logOnError = true): unknown {
  try {
    return JSON.parse(input);
  } catch (error) {
    if (logOnError) {
      console.warn("[summary-utils] Failed to parse calculator reply as JSON", error);
    }
    return null;
  }
}

function parseMetrics(rawMetrics: unknown): CalculatorSummaryMetric[] | undefined {
  if (!Array.isArray(rawMetrics)) {
    return undefined;
  }

  const metrics = rawMetrics
    .map((metric) => {
      if (!metric || typeof metric !== "object") {
        return null;
      }

      const label = typeof (metric as JsonLike).label === "string" ? (metric as JsonLike).label : undefined;
      const value = (metric as JsonLike).value;
      const unit = typeof (metric as JsonLike).unit === "string" ? (metric as JsonLike).unit : undefined;

      if (!label || (typeof value !== "string" && typeof value !== "number")) {
        return null;
      }

      return { label, value, unit };
    })
    .filter(Boolean) as CalculatorSummaryMetric[];

  return metrics.length ? metrics : undefined;
}

function parseStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value
    .map((item) => (typeof item === "string" ? item.trim() : null))
    .filter(Boolean) as string[];

  return items.length ? items : undefined;
}

function parseSection(rawSection: unknown): CalculatorSummarySection | null {
  if (!rawSection || typeof rawSection !== "object") {
    return null;
  }

  const section = rawSection as JsonLike;
  const type = typeof section.type === "string" ? section.type : "custom";
  const headline = typeof section.headline === "string" ? section.headline : undefined;
  const summary = typeof section.summary === "string" ? section.summary : undefined;
  const details = typeof section.details === "string" ? section.details : undefined;
  const metrics = parseMetrics(section.metrics);
  const bullets = parseStringArray(section.bullets);
  const assumptions = parseStringArray(section.assumptions);
  const risks = parseStringArray(section.risks);

  if (!headline && !summary && !details && !metrics && !bullets && !assumptions && !risks) {
    return null;
  }

  return {
    type,
    headline,
    summary,
    details,
    metrics,
    bullets,
    assumptions,
    risks,
  };
}

function parseInsight(rawInsight: unknown): CalculatorInsight | null {
  if (!rawInsight || typeof rawInsight !== "object" || Array.isArray(rawInsight)) {
    return null;
  }

  const insight = rawInsight as JsonLike;
  const rawSections = Array.isArray(insight.sections) ? insight.sections : [];
  const sections = rawSections
    .map((section) => parseSection(section))
    .filter(Boolean) as CalculatorSummarySection[];

  if (!sections.length) {
    return null;
  }

  const calculatorField = typeof insight.calculator === "object" && insight.calculator
    ? insight.calculator
    : undefined;

  const context = typeof insight.context === "object" && insight.context && !Array.isArray(insight.context)
    ? (insight.context as Record<string, unknown>)
    : undefined;

  const notes = parseStringArray(insight.notes);

  return {
    calculator: calculatorField as CalculatorInsight["calculator"],
    context,
    sections,
    notes,
  };
}

function parsePoints(rawPoints: unknown): TimeSeriesPoint[] {
  if (!Array.isArray(rawPoints)) {
    return [];
  }

  return rawPoints
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as JsonLike;
      const date = typeof candidate.date === "string" ? candidate.date : "";
      const rawPrice = candidate.price;
      const price = typeof rawPrice === "number" ? rawPrice : Number(rawPrice);

      if (!date || Number.isNaN(price)) {
        return null;
      }

      return { date, price } satisfies TimeSeriesPoint;
    })
    .filter(Boolean) as TimeSeriesPoint[];
}

function parseSeriesCollection(rawSeries: unknown): TimeSeriesPoint[] {
  if (!Array.isArray(rawSeries)) {
    return [];
  }

  for (const entry of rawSeries) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const points = parsePoints((entry as JsonLike).points ?? (entry as JsonLike).data);
    if (points.length) {
      return points;
    }
  }

  return [];
}

function parseLegacySummaryAndDataset(reply: string) {
  const normalizedReply = reply ?? "";
  const jsonStart = normalizedReply.indexOf("[");
  const jsonEnd = normalizedReply.lastIndexOf("]");

  let summary = normalizedReply.trim();
  let dataset: TimeSeriesPoint[] = [];

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    summary = normalizedReply.slice(0, jsonStart).replace(DATA_LABEL_PATTERN, "").replace(SUMMARY_LABEL_PATTERN, "").trim();
    const jsonString = normalizedReply.slice(jsonStart, jsonEnd + 1);

    const parsed = tryParseJson(jsonString, false);
    if (Array.isArray(parsed)) {
      dataset = parsePoints(parsed);
    }
  }

  if (!summary) {
    summary = "Nova did not return a summary for this scenario.";
  }

  return { summary, dataset };
}

function extractDataset(parsed: JsonLike): TimeSeriesPoint[] {
  const fromSeries = parseSeriesCollection(parsed.series);
  if (fromSeries.length) {
    return fromSeries;
  }

  const fromData = parsePoints(parsed.data);
  if (fromData.length) {
    return fromData;
  }

  const fromLegacyData = parsePoints(parsed.DATA);
  if (fromLegacyData.length) {
    return fromLegacyData;
  }

  return [];
}

/**
 * Parses Nova calculator replies that emit the structured insight schema.
 * Falls back to the legacy SUMMARY/DATA parsing when newer fields are absent.
 */
export function parseCalculatorReply(reply: string): CalculatorResult {
  const normalizedReply = reply?.trim() ?? "";

  if (!normalizedReply) {
    return {
      insight: null,
      dataset: [],
      fallbackSummary: "Nova did not return any content for this scenario.",
      fallbackLines: ["Nova did not return any content for this scenario."],
    };
  }

  const parsed = tryParseJson(normalizedReply);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const parsedObject = parsed as JsonLike;
    const insight = parseInsight(parsedObject.insight);
    const dataset = extractDataset(parsedObject);

    const result: CalculatorResult = {
      insight,
      dataset,
    };

    if (!insight) {
      const fallbackSummary =
        typeof parsedObject.summary === "string" ? parsedObject.summary.trim() : undefined;

      if (fallbackSummary) {
        result.fallbackSummary = fallbackSummary;
        result.fallbackLines = formatSummaryLines(fallbackSummary);
      }
    }

    return result;
  }

  const legacy = parseLegacySummaryAndDataset(normalizedReply);

  return {
    insight: null,
    dataset: legacy.dataset,
    fallbackSummary: legacy.summary,
    fallbackLines: formatSummaryLines(legacy.summary),
  };
}

/**
 * Normalizes fallback summaries into UI-ready lines.
 */
export function formatSummaryLines(summary: string) {
  if (!summary) {
    return ["Nova didn't provide a written summary for this run."];
  }

  const lines = summary
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [summary];
  }

  return lines.map((line) => line.replace(/^[-•]\s*/, ""));
}
