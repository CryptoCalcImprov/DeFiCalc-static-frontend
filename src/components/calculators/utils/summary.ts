import type { TimeSeriesPoint } from "@/components/calculators/types";

export type ParsedSummaryResult = {
  summary: string;
  dataset: TimeSeriesPoint[];
};

const DATA_LABEL_PATTERN = /DATA:\s*$/i;
const SUMMARY_LABEL_PATTERN = /SUMMARY:\s*/i;

/**
 * Extracts the SUMMARY section and DATA array emitted by Nova calculators.
 * Applies defensive parsing so individual calculators can focus on domain logic.
 */
export function parseSummaryAndDataset(reply: string): ParsedSummaryResult {
  const normalizedReply = reply ?? "";
  const jsonStart = normalizedReply.indexOf("[");
  const jsonEnd = normalizedReply.lastIndexOf("]");

  let summary = normalizedReply.trim();
  let dataset: TimeSeriesPoint[] = [];

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    summary = normalizedReply.slice(0, jsonStart).replace(DATA_LABEL_PATTERN, "").replace(SUMMARY_LABEL_PATTERN, "").trim();
    const jsonString = normalizedReply.slice(jsonStart, jsonEnd + 1);

    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        dataset = parsed
          .map((item) => {
            const date = typeof item?.date === "string" ? item.date : "";
            const priceValue = typeof item?.price === "number" ? item.price : Number(item?.price);

            if (!date || Number.isNaN(priceValue)) {
              return null;
            }

            return { date, price: priceValue } satisfies TimeSeriesPoint;
          })
          .filter(Boolean) as TimeSeriesPoint[];
      }
    } catch (error) {
      console.warn("[summary-utils] Failed to parse DATA block", error);
    }
  }

  if (!summary) {
    summary = "Nova did not return a summary for this scenario.";
  }

  return { summary, dataset };
}

/**
 * Normalizes Nova bullet summaries into UI-ready lines.
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
