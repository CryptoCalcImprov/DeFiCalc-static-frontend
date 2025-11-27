import { callMcpTools, type McpToolCallResult } from "./nova-client";

export type ForecastDurationKey = "one_month" | "three_months" | "six_months" | "one_year";

export const FORECAST_DURATION_MAP: Record<string, ForecastDurationKey> = {
  "1 month": "one_month",
  "3 months": "three_months",
  "6 months": "six_months",
  "1 year": "one_year",
};

export type ForecastHistoryPoint = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type ForecastProjectionPoint = {
  timestamp: string;
  percentile_10?: number;
  percentile_50?: number;
  mean?: number;
  percentile_90?: number;
};

export type ForecastSamplePath = {
  label?: string;
  points?: number[];
};

export type NovaForecastResponse = {
  forecast?: {
    type?: string;
    value?: {
      sample_paths?: ForecastSamplePath[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  chart?: {
    history?: ForecastHistoryPoint[];
    projection?: ForecastProjectionPoint[];
  };
};

function extractTextPayload(result: McpToolCallResult | undefined): string {
  if (!result) {
    throw new Error("MCP tools response was empty.");
  }

  if (result.isError) {
    throw new Error("MCP tool execution failed. Check the tool name and arguments.");
  }

  const textEntry = result.content?.find(
    (entry) => entry?.type === "text" && typeof entry.text === "string" && entry.text.trim(),
  );

  if (!textEntry || typeof textEntry.text !== "string") {
    throw new Error("MCP tool response did not include a text payload.");
  }

  return textEntry.text;
}

export async function requestLongTermForecast(args: {
  assetId: string;
  duration: ForecastDurationKey;
  vsCurrency?: string;
  includeChart?: boolean;
}): Promise<NovaForecastResponse> {
  const { assetId, duration, vsCurrency = "usd", includeChart = true } = args;

  console.log("[Forecast] Requesting long-term forecast", {
    assetId,
    duration,
    vsCurrency,
    includeChart,
  });

  const toolsPayload = [
    {
      name: "get_forecast",
      arguments: {
        asset_id: assetId,
        forecast_type: "long",
        duration,
        vs_currency: vsCurrency,
        include_chart: includeChart,
      },
    },
  ];

  const results = await callMcpTools(toolsPayload);
  const textPayload = extractTextPayload(results[0]);

  try {
    const parsed = textPayload ? (JSON.parse(textPayload) as NovaForecastResponse) : {};
    console.log("[Forecast] Received forecast response", parsed);
    return parsed;
  } catch (error) {
    console.error("[NovaForecast] Failed to parse forecast payload:", error, textPayload);
    throw new Error("Unable to parse the long-term forecast payload returned by Nova.");
  }
}
