"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { ChartConfiguration } from "chart.js";

import { requestNova } from "@/lib/nova-client";
import { MessageParser } from "@/components/ui/message-parser";

type DcaDataPoint = {
  date: string;
  price: number;
};

type ChartConstructor = typeof import("chart.js/auto") extends { default: infer T } ? T : never;
type ChartInstance = ChartConstructor extends new (...args: any[]) => infer R ? R : never;

type DcaFormState = {
  token: string;
  amount: string;
  interval: string;
  duration: string;
};

const defaultFormState: DcaFormState = {
  token: "ETH",
  amount: "500",
  interval: "bi-weekly",
  duration: "6 months",
};

const initialSummaryMessage = "Run the projection to see Nova's perspective on this plan.";
const pendingSummaryMessage = "Generating Nova's latest projection...";

function buildPrompt({ token, amount, interval, duration }: DcaFormState) {
  return (
    `Given your standing role as Nova's trading copilot, evaluate the following dollar-cost-averaging plan.\n` +
    `Respond in a single message, do not request clarification, and do not ask any follow-up questions.\n` +
    `Plan details: invest ${amount} USD of ${token} on a ${interval} cadence for ${duration}.\n\n` +
    `Guidelines:\n` +
    `1. Determine the schedule start date automatically: call your date/time capability to retrieve today's UTC date and use it as the starting point. Do not ask the user.\n` +
    `2. Generate a plausible synthetic price path that matches the cadence and duration. When real history improves realism, use the available data tools silently; otherwise craft a consistent synthetic series.\n` +
    `3. Summarize performance factors, expected cost basis shifts, and key risks in exactly three concise bullet points. State any assumptions directly inside the bullets.\n` +
    `4. After the summary, output a JSON array labeled DATA containing objects formatted as {"date":"YYYY-MM-DD","price":number}. Provide one entry per scheduled purchase date, ordered chronologically. Prices must be numbers, not strings.\n` +
    `5. Never ask questions, never defer the calculation, and always include both the SUMMARY section and the DATA array.\n\n` +
    `Use the following structure exactly:\nSUMMARY:\n- bullet point one\n- bullet point two\n- bullet point three\nDATA:\n[{"date":"2024-01-01","price":123.45}, ...]`
  );
}

function parseNovaReply(reply: string) {
  const normalizedReply = reply ?? "";
  const jsonStart = normalizedReply.indexOf("[");
  const jsonEnd = normalizedReply.lastIndexOf("]");

  let summary = normalizedReply.trim();
  let dataset: DcaDataPoint[] = [];

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    summary = normalizedReply.slice(0, jsonStart).replace(/DATA:\s*$/i, "").replace(/SUMMARY:\s*/i, "").trim();
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

            return { date, price: priceValue } satisfies DcaDataPoint;
          })
          .filter(Boolean) as DcaDataPoint[];
      }
    } catch (error) {
      console.warn("Failed to parse Nova DCA dataset", error);
    }
  }

  if (!summary) {
    summary = "Nova did not return a summary for this scenario.";
  }

  return { summary, dataset };
}

function formatSummary(summary: string) {
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

export function DcaCalculatorSection() {
  const [formState, setFormState] = useState<DcaFormState>(defaultFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>(initialSummaryMessage);
  const [dataset, setDataset] = useState<DcaDataPoint[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);

  const hasDataset = dataset.length > 0;

  const summaryLines = useMemo(() => formatSummary(summary), [summary]);

  const handleFieldChange = (field: keyof DcaFormState) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { value } = event.target;
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    let isMounted = true;

    const renderChart = async () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      if (!hasDataset) {
        chartRef.current?.destroy();
        chartRef.current = null;
        return;
      }

      try {
        const chartModule = await import("chart.js/auto");
        if (!isMounted || !canvas) {
          return;
        }

        const ChartJs = chartModule.default as ChartConstructor;

        chartRef.current?.destroy();

        const config: ChartConfiguration<"line", number[], string> = {
          type: "line",
          data: {
            labels: dataset.map((point) => point.date),
            datasets: [
              {
                label: `${formState.token} price`,
                data: dataset.map((point) => point.price),
                borderColor: "rgba(58, 198, 255, 0.95)",
                backgroundColor: "rgba(58, 198, 255, 0.14)",
                tension: 0.32,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointBackgroundColor: "#36D6C3",
                pointBorderColor: "#041A2A",
                pointBorderWidth: 2,
                pointHitRadius: 12,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: {
                  color: "#E6EFFA",
                  font: {
                    size: 12,
                  },
                },
              },
              tooltip: {
                backgroundColor: "rgba(6, 21, 34, 0.92)",
                titleColor: "#F6FAFF",
                bodyColor: "#CBD5E1",
                borderColor: "rgba(58, 198, 255, 0.45)",
                borderWidth: 1,
              },
            },
            scales: {
              x: {
                ticks: {
                  color: "#94A3B8",
                },
                grid: {
                  color: "rgba(19, 44, 63, 0.45)",
                },
              },
              y: {
                ticks: {
                  color: "#94A3B8",
                },
                grid: {
                  color: "rgba(19, 44, 63, 0.45)",
                },
              },
            },
          },
        };

        chartRef.current = new ChartJs(canvas, config);
      } catch (chartError) {
        console.error("Failed to render DCA chart", chartError);
      }
    };

    void renderChart();

    return () => {
      isMounted = false;
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [dataset, formState.token, hasDataset]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsLoading(true);
    setError(null);
    setDataset([]);
    setSummary(pendingSummaryMessage);

    try {
      const prompt = buildPrompt(formState);
      // Increase max_tokens for DCA since we need structured output with JSON
      const { reply } = await requestNova(prompt, {
        body: JSON.stringify({
          input: prompt.trim(),
          model: "gpt-5-mini",
          temperature: 0.0,
          verbosity: "low",
          max_tokens: 50000, // Increased for structured output with JSON data
          reasoning: true,
          reasoning_params: {},
          image_urls: [],
        }),
      });
      
      console.log('[DCA] Received reply length:', reply.length);
      console.log('[DCA] First 200 chars:', reply.substring(0, 200));
      
      // Check if Nova returned empty content
      if (!reply || !reply.trim()) {
        setError("Nova returned an empty response. The gateway might be experiencing issues.");
        setDataset([]);
        setSummary("Unable to process the DCA projection. Please try again in a moment.");
        setIsLoading(false);
        return;
      }
      
      const { summary: parsedSummary, dataset: parsedDataset } = parseNovaReply(reply);

      setSummary(parsedSummary);
      setDataset(parsedDataset);

      if (!parsedDataset.length) {
        setError("Nova didn't return price history data for this run. Showing the textual summary instead.");
      }
    } catch (novaError) {
      console.error('[DCA] Request error:', novaError);
      const message =
        novaError instanceof Error
          ? novaError.message
          : "Something went wrong when requesting the DCA projection.";
      setError(message);
      setDataset([]);
      setSummary("Nova couldn't complete this request. Please adjust your inputs and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-8">
        <form
          className="card-surface flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-slate-950/75 via-slate-950/55 to-slate-900/30 p-4 sm:gap-5 sm:rounded-3xl sm:p-6"
          onSubmit={handleSubmit}
        >
          <div>
            <h3 className="text-lg font-semibold text-slate-50 sm:text-xl">Configure your DCA plan</h3>
            <p className="mt-1.5 text-xs text-muted sm:mt-2 sm:text-sm">
              Adjust token, contribution size, cadence, and horizon to see how Nova models accumulation over time.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-200 sm:gap-2 sm:text-sm">
              Token
              <input
                type="text"
                value={formState.token}
                onChange={handleFieldChange("token")}
                className="rounded-xl border border-ocean/60 bg-surface/90 px-3 py-1.5 text-sm text-slate-50 placeholder:text-slate-500 shadow-inner focus:border-mint focus:bg-surface/95 focus:outline-none focus:ring-1 focus:ring-mint/35 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-base"
                placeholder="e.g. ETH"
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-200 sm:gap-2 sm:text-sm">
              Contribution amount (USD)
              <input
                type="number"
                min="10"
                step="10"
                value={formState.amount}
                onChange={handleFieldChange("amount")}
                className="rounded-xl border border-ocean/60 bg-surface/90 px-3 py-1.5 text-sm text-slate-50 placeholder:text-slate-500 shadow-inner focus:border-mint focus:bg-surface/95 focus:outline-none focus:ring-1 focus:ring-mint/35 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-base"
                placeholder="e.g. 500"
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-200 sm:gap-2 sm:text-sm">
              Purchase cadence
              <select
                value={formState.interval}
                onChange={handleFieldChange("interval")}
                className="rounded-xl border border-ocean/60 bg-surface/90 px-3 py-1.5 text-sm text-slate-50 focus:border-mint focus:bg-surface/95 focus:outline-none focus:ring-1 focus:ring-mint/35 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-base"
              >
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-200 sm:gap-2 sm:text-sm">
              Duration
              <select
                value={formState.duration}
                onChange={handleFieldChange("duration")}
                className="rounded-xl border border-ocean/60 bg-surface/90 px-3 py-1.5 text-sm text-slate-50 focus:border-mint focus:bg-surface/95 focus:outline-none focus:ring-1 focus:ring-mint/35 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-base"
              >
                <option value="3 months">3 months</option>
                <option value="6 months">6 months</option>
                <option value="1 year">1 year</option>
                <option value="2 years">2 years</option>
              </select>
            </label>
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-cta-gradient px-4 py-2.5 text-xs font-semibold text-slate-50 shadow-lg shadow-[rgba(58,198,255,0.24)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint sm:px-5 sm:py-3 sm:text-sm"
            disabled={isLoading}
          >
            {isLoading ? "Generating projection..." : "Run DCA projection"}
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M5 3l6 5-6 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {error ? <p className="text-sm text-critical">{error}</p> : null}
        </form>
        <div className="card-surface-muted flex h-full flex-col gap-4 rounded-2xl bg-gradient-to-br from-slate-950/65 via-slate-950/45 to-slate-900/24 p-4 shadow-[0_10px_32px_rgba(6,21,34,0.32)] sm:gap-5 sm:rounded-3xl sm:p-6">
          <div className="flex h-full flex-col">
            <h3 className="text-lg font-semibold text-slate-50 sm:text-xl">Nova&rsquo;s takeaway</h3>
            <div className="mt-3 flex flex-1 sm:mt-4">
              <div className="flex-1 rounded-2xl border border-ocean/65 bg-surface/80 p-4 shadow-inner shadow-[0_0_28px_rgba(7,24,36,0.22)] sm:p-5">
                <ul className="space-y-2 text-xs leading-relaxed text-muted sm:space-y-3 sm:text-sm">
                  {summaryLines.map((line, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-mint shadow-[0_0_8px_rgba(58,198,255,0.65)]" aria-hidden />
                      <MessageParser content={line} className="flex-1" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="card-surface rounded-2xl bg-gradient-to-br from-slate-950/70 via-slate-950/50 to-slate-900/25 p-4 sm:rounded-3xl sm:p-6">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-100 sm:text-sm">Price trajectory</h4>
        <div className="mt-3 h-56 min-w-0 overflow-hidden rounded-2xl border border-ocean/60 bg-surface/75 sm:mt-4 sm:h-72 lg:h-96">
          {hasDataset ? (
            <canvas ref={canvasRef} className="h-full w-full max-w-full" style={{ width: "100%", height: "100%" }} />
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-ocean/55 bg-surface/65 text-center text-sm text-muted">
              {isLoading
                ? "Asking Nova for price history..."
                : "Run the projection to visualize Nova's modeled price path."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
