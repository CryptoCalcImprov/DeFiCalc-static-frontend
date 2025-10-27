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
  return `You are Nova, a DeFi research assistant helping an analyst evaluate a dollar-cost-averaging plan.\n` +
    `Calculate the projected accumulation results for purchasing ${amount} USD of ${token} on a ${interval} cadence over ${duration}.\n` +
    `Summarize performance factors, expected cost basis shifts, and risk considerations in 3 bullet points.\n` +
    `After the summary, output a JSON array labeled DATA with objects formatted as {"date":"YYYY-MM-DD","price":number} representing the synthetic price series used for the calculation.\n` +
    `Use the following structure exactly:\nSUMMARY:\n- bullet point one\n- bullet point two\n- bullet point three\nDATA:\n[{"date":"2024-01-01","price":123.45}, ...]\nEnsure prices are numbers, not strings.`;
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
                borderColor: "#22d3ee",
                backgroundColor: "rgba(34, 211, 238, 0.15)",
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
                  color: "#e2e8f0",
                  font: {
                    size: 12,
                  },
                },
              },
              tooltip: {
                backgroundColor: "#0f172a",
                titleColor: "#e2e8f0",
                bodyColor: "#cbd5f5",
                borderColor: "#22d3ee",
                borderWidth: 1,
              },
            },
            scales: {
              x: {
                ticks: {
                  color: "#94a3b8",
                },
                grid: {
                  color: "rgba(148, 163, 184, 0.1)",
                },
              },
              y: {
                ticks: {
                  color: "#94a3b8",
                },
                grid: {
                  color: "rgba(148, 163, 184, 0.1)",
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
        payloadOverrides: {
          max_tokens: 30000, // Increased for structured output with JSON data
        },
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
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <form
        className="flex flex-col gap-6 rounded-3xl border border-slate-800/70 bg-slate-950/80 p-6"
        onSubmit={handleSubmit}
      >
        <div>
          <h3 className="text-xl font-semibold text-white">Configure your DCA plan</h3>
          <p className="mt-2 text-sm text-slate-400">
            Adjust token, contribution size, cadence, and horizon to see how Nova models accumulation over time.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
            Token
            <input
              type="text"
              value={formState.token}
              onChange={handleFieldChange("token")}
              className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-2 text-white placeholder:text-slate-500 focus:border-mint focus:outline-none"
              placeholder="e.g. ETH"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
            Contribution amount (USD)
            <input
              type="number"
              min="10"
              step="10"
              value={formState.amount}
              onChange={handleFieldChange("amount")}
              className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-2 text-white placeholder:text-slate-500 focus:border-mint focus:outline-none"
              placeholder="e.g. 500"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
            Purchase cadence
            <select
              value={formState.interval}
              onChange={handleFieldChange("interval")}
              className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-2 text-white focus:border-mint focus:outline-none"
            >
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
            Duration
            <select
              value={formState.duration}
              onChange={handleFieldChange("duration")}
              className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-2 text-white focus:border-mint focus:outline-none"
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
          className="inline-flex items-center justify-center gap-2 rounded-full bg-cta-gradient px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint"
          disabled={isLoading}
        >
          {isLoading ? "Generating projection..." : "Run DCA projection"}
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M5 3l6 5-6 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      </form>
      <div className="flex flex-col gap-6 rounded-3xl border border-slate-800/70 bg-slate-950/60 p-6">
        <div>
          <h3 className="text-xl font-semibold text-white">Nova&rsquo;s takeaway</h3>
          <ul className="mt-3 space-y-3 text-sm leading-relaxed text-slate-300">
            {summaryLines.map((line, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-mint" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1 rounded-2xl border border-slate-800/60 bg-slate-950/80 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Price trajectory</h4>
          <div className="mt-4 h-64">
            {hasDataset ? (
              <canvas ref={canvasRef} className="h-full w-full" />
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-800/80 bg-slate-950/80 text-center text-sm text-slate-500">
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
