import type { TrendFollowingDataPoint } from "./trend-following-chart";

const DATA_LABEL_PATTERN = /DATA:\s*$/i;
const SUMMARY_LABEL_PATTERN = /SUMMARY:\s*/i;

export type TrendFollowingResult = {
  summary: string;
  dataset: TrendFollowingDataPoint[];
};

/**
 * Extracts the SUMMARY section and DATA array from Nova's reply for trend-following calculator.
 * The DATA array contains extended fields: date, price, ma, portfolioEquity, hodlValue
 */
export function parseTrendFollowingReply(reply: string): TrendFollowingResult {
  const normalizedReply = reply ?? "";
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
        dataset = parsed
          .map((item) => {
            const date = typeof item?.date === "string" ? item.date : "";
            const priceValue = typeof item?.price === "number" ? item.price : Number(item?.price);
            const maValue = typeof item?.ma === "number" ? item.ma : Number(item?.ma);
            const portfolioEquityValue =
              typeof item?.portfolioEquity === "number" ? item.portfolioEquity : Number(item?.portfolioEquity);
            const hodlValueValue = typeof item?.hodlValue === "number" ? item.hodlValue : Number(item?.hodlValue);

            if (
              !date ||
              Number.isNaN(priceValue) ||
              Number.isNaN(maValue) ||
              Number.isNaN(portfolioEquityValue) ||
              Number.isNaN(hodlValueValue)
            ) {
              return null;
            }

            return {
              date,
              price: priceValue,
              ma: maValue,
              portfolioEquity: portfolioEquityValue,
              hodlValue: hodlValueValue,
            } satisfies TrendFollowingDataPoint;
          })
          .filter(Boolean) as TrendFollowingDataPoint[];
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

