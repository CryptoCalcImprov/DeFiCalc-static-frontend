"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { ChartConfiguration } from "chart.js";

import { requestNova } from "@/lib/nova-client";

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

function buildPrompt({ token, amount, interval, duration }: DcaFormState) {
  return (
    `You are Nova, a DeFi research assistant helping an analyst evaluate a dollar-cost-averaging plan.\n` +
    `You must respond in a single message without requesting clarification or follow-up details.\n` +
    `Plan details: invest ${amount} USD of ${token} on a ${interval} cadence for ${duration}.\n\n` +
    `Guidelines:\n` +
    `1. Determine the schedule start date automatically: call your date/time capability to retrieve today's UTC date and use it as the starting point. Do not ask the user.\n` +
    `2. Generate a plausible synthetic price path that matches the cadence and duration. If historical context improves realism, silently call available data tools (e.g., CoinDesk history) without prompting the user; otherwise craft a consistent synthetic series.\n` +
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
  const [summary, setSummary] = useState<string>("Run the projection to see Nova's perspective on this plan.");
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
                borderColor: "#36D6C3",
                backgroundColor: "rgba(54, 214, 195, 0.18)",
                tension: 0.35,
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: {
                  color: "#F6FAFF",
                  font: {
                    size: 12,
                  },
                },
              },
              tooltip: {
                backgroundColor: "#0C2537",
                titleColor: "#F6FAFF",
                bodyColor: "#CBD5E1",
                borderColor: "#3AC6FF",
                borderWidth: 1,
              },
            },
            scales: {
              x: {
                ticks: {
                  color: "#7E90A6",
                },
                grid: {
                  color: "rgba(126, 144, 166, 0.12)",
                },
              },
              y: {
                ticks: {
                  color: "#7E90A6",
                },
                grid: {
                  color: "rgba(126, 144, 166, 0.12)",
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

    try {
      const prompt = buildPrompt(formState);
      // Increase max_tokens for DCA since we need structured output with JSON
      const { reply } = await requestNova(prompt, {
        body: JSON.stringify({
          input: prompt.trim(),
          model: "gpt-5-mini",
          temperature: 0.0,
          verbosity: "low",
          max_tokens: 18000, // Increased for structured output with JSON data
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-8">
      <form
        className="flex flex-col gap-4 rounded-2xl border border-slate-800/55 bg-surface/80 p-4 shadow-[0_10px_32px_rgba(6,21,34,0.35)] backdrop-blur-sm sm:gap-5 sm:rounded-3xl sm:p-6"
        onSubmit={handleSubmit}
      >
        <div>
          <h3 className="text-lg font-semibold text-slate-50 sm:text-xl">Configure your DCA plan</h3>
          <p className="mt-1.5 text-xs text-slate-300 sm:mt-2 sm:text-sm">
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
              className="rounded-xl border border-slate-800/60 bg-background/70 px-3 py-1.5 text-sm text-slate-50 placeholder:text-slate-500 focus:border-mint focus:outline-none focus:ring-0 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-base"
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
              className="rounded-xl border border-slate-800/60 bg-background/70 px-3 py-1.5 text-sm text-slate-50 placeholder:text-slate-500 focus:border-mint focus:outline-none focus:ring-0 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-base"
              placeholder="e.g. 500"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-200 sm:gap-2 sm:text-sm">
            Purchase cadence
            <select
              value={formState.interval}
              onChange={handleFieldChange("interval")}
              className="rounded-xl border border-slate-800/60 bg-background/70 px-3 py-1.5 text-sm text-slate-50 focus:border-mint focus:outline-none focus:ring-0 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-base"
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
              className="rounded-xl border border-slate-800/60 bg-background/70 px-3 py-1.5 text-sm text-slate-50 focus:border-mint focus:outline-none focus:ring-0 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-base"
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
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800/50 bg-surface/70 p-4 shadow-[0_10px_32px_rgba(6,21,34,0.25)] backdrop-blur-sm sm:gap-5 sm:rounded-3xl sm:p-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-50 sm:text-xl">Nova&rsquo;s takeaway</h3>
          <ul className="mt-2 space-y-2 text-xs leading-relaxed text-slate-300 sm:mt-3 sm:space-y-3 sm:text-sm">
            {summaryLines.map((line, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-mint" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1 rounded-xl border border-slate-800/55 bg-background/70 p-3 sm:rounded-2xl sm:p-4">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-400 sm:text-sm">Price trajectory</h4>
          <div className="mt-3 h-48 sm:mt-4 sm:h-64">
            {hasDataset ? (
              <canvas ref={canvasRef} className="h-full w-full" />
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-800/65 bg-background/60 text-center text-sm text-slate-500">
                {isLoading
                  ? "Asking Nova for price history..."
                  : "Run the projection to visualize Nova's modeled price path."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
