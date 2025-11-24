import type {
  CalculatorInsight,
  CalculatorResult,
  CalculatorSummaryMetric,
  CalculatorSummarySection,
  CoinGeckoCandle,
  NovaChartData,
  StrategyOverlay,
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

function parseStrategyOverlayPoints(rawPoints: unknown) {
  if (!Array.isArray(rawPoints)) {
    return [];
  }

  const points = rawPoints
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

      return { date, price } as StrategyOverlay["points"][number];
    })
    .filter(Boolean) as StrategyOverlay["points"];

  return points;
}

function parseStrategyOverlay(rawOverlay: unknown): StrategyOverlay | null {
  if (!rawOverlay || typeof rawOverlay !== "object") {
    return null;
  }

  const overlay = rawOverlay as JsonLike;
  const id = typeof overlay.id === "string" ? overlay.id : undefined;
  const label = typeof overlay.label === "string" ? overlay.label : undefined;
  const type = typeof overlay.type === "string" ? overlay.type : undefined;
  const points = parseStrategyOverlayPoints(overlay.points);
  const metadata =
    overlay.metadata && typeof overlay.metadata === "object" ? overlay.metadata as Record<string, unknown> : undefined;

  if (!id || !label || !type || !points.length) {
    return null;
  }

  const normalizedType =
    type === "buy" || type === "sell" || type === "annotation" ? (type as StrategyOverlay["type"]) : undefined;

  if (!normalizedType) {
    return null;
  }

  return {
    id,
    label,
    type: normalizedType,
    points,
    metadata,
  };
}

function parseStrategyOverlays(rawOverlays: unknown): StrategyOverlay[] {
  if (!Array.isArray(rawOverlays)) {
    return [];
  }

  return rawOverlays
    .map((overlay) => parseStrategyOverlay(overlay))
    .filter(Boolean) as StrategyOverlay[];
}

function parseChartData(rawChartData: unknown): NovaChartData | undefined {
  if (!rawChartData || typeof rawChartData !== "object") {
    console.log("[parseChartData] No chart data or not an object");
    return undefined;
  }

  const data = rawChartData as JsonLike;
  
  // Handle both MCP format (history/projection) and our format (historical/projection)
  const historyArray = (Array.isArray(data.history) ? data.history : 
                        Array.isArray(data.historical) ? data.historical : []) as unknown[];
  const projectionArray = (Array.isArray(data.projection) ? data.projection : []) as unknown[];

  console.log("[parseChartData] Found arrays:", {
    historyCount: historyArray.length,
    projectionCount: projectionArray.length,
    hasHistory: Array.isArray(data.history),
    hasHistorical: Array.isArray(data.historical),
    hasProjection: Array.isArray(data.projection),
    dataKeys: Object.keys(data),
  });

  if (!historyArray.length && !projectionArray.length) {
    console.log("[parseChartData] No data in arrays");
    return undefined;
  }

  // Helper to convert ISO timestamp to YYYY-MM-DD
  const formatDate = (dateOrTimestamp: string): string => {
    if (!dateOrTimestamp) return "";
    // If already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateOrTimestamp)) {
      return dateOrTimestamp;
    }
    // Otherwise parse ISO timestamp and convert
    try {
      const parsed = new Date(dateOrTimestamp);
      return parsed.toISOString().slice(0, 10);
    } catch {
      return "";
    }
  };

  const historical = historyArray
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const candle = item as JsonLike;
      // Handle both 'date' and 'timestamp' fields
      const dateStr = formatDate(
        (typeof candle.date === "string" ? candle.date : 
         typeof candle.timestamp === "string" ? candle.timestamp : "")
      );
      return {
        date: dateStr,
        open: Number(candle.open || 0),
        high: Number(candle.high || 0),
        low: Number(candle.low || 0),
        close: Number(candle.close || 0),
      };
    })
    .filter((item): item is CoinGeckoCandle => Boolean(item && item.date));

  const projection = projectionArray
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const point = item as JsonLike;
      // Handle both 'date' and 'timestamp' fields
      const dateStr = formatDate(
        (typeof point.date === "string" ? point.date : 
         typeof point.timestamp === "string" ? point.timestamp : "")
      );
      return {
        date: dateStr,
        mean: Number(point.mean || 0),
        percentile_10: Number(point.percentile_10 || 0),
        percentile_90: Number(point.percentile_90 || 0),
      };
    })
    .filter((item): item is NovaChartData["projection"][number] => Boolean(item && item.date));

  if (!historical.length && !projection.length) {
    console.log("[parseChartData] No data after filtering");
    return undefined;
  }

  console.log("[parseChartData] Successfully parsed:", {
    historicalCount: historical.length,
    projectionCount: projection.length,
    firstHistorical: historical[0],
    firstProjection: projection[0],
  });

  const metadata = data.metadata as JsonLike | undefined;
  const technicalSignals = metadata?.technical_signals as Record<string, number> | undefined;

  return {
    historical,
    projection,
    metadata: {
      confidence: typeof metadata?.confidence === "number" ? metadata.confidence : undefined,
      technical_signals: technicalSignals,
    },
  };
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
    const chartData = parseChartData(parsedObject.chart_data);

    const result: CalculatorResult = {
      insight,
      dataset,
      chartData,
    };

    const strategyOverlays = parseStrategyOverlays(parsedObject.strategy_overlays);
    if (strategyOverlays.length) {
      result.strategyOverlays = strategyOverlays;
    }

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
