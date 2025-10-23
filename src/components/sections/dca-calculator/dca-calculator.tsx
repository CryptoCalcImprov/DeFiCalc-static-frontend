"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";

import { Button } from "@/components/ui/button";

type DcaInterval = "daily" | "weekly" | "monthly";
type DurationUnit = "weeks" | "months" | "years";

type FormState = {
  token: string;
  amount: string;
  interval: DcaInterval;
  durationValue: string;
  durationUnit: DurationUnit;
};

type PricePoint = {
  date: string;
  price: number;
};

type DcaMetrics = {
  totalInvested?: number;
  totalTokens?: number;
  currentValue?: number;
  averagePrice?: number;
};

type DcaAnalysis = {
  token: string;
  summary: string;
  prices: PricePoint[];
  metrics?: DcaMetrics;
  interval: DcaInterval;
  durationLabel: string;
};

type NovaStatus =
  | { status: "idle" }
  | { status: "pending"; requestId: string }
  | { status: "success"; requestId: string; analysis: DcaAnalysis }
  | { status: "error"; requestId?: string; message: string };

const fallbackMessage =
  "Nova isn't connected in this preview. Deploy with a Nova API key to generate DCA analysis.";

const intervalLabels: Record<DcaInterval, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const durationUnitLabels: Record<DurationUnit, { singular: string; plural: string }> = {
  weeks: { singular: "week", plural: "weeks" },
  months: { singular: "month", plural: "months" },
  years: { singular: "year", plural: "years" },
};

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const tokenFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 6,
});

function formatDuration(value: number, unit: DurationUnit) {
  const labelConfig = durationUnitLabels[unit];
  const label = value === 1 ? labelConfig.singular : labelConfig.plural;
  return `${value} ${label}`;
}

function createNovaPrompt(form: FormState, durationLabel: string) {
  const amount = Number.parseFloat(form.amount) || 0;
  const intervalLabel = intervalLabels[form.interval].toLowerCase();

  return `You are Nova, a DeFi research assistant. The user wants to evaluate a dollar-cost averaging plan.
Token symbol: ${form.token?.trim() || ""}
Recurring investment: ${amount} USD ${intervalLabel}
Duration: last ${durationLabel}

Use the get_coindesk_history tool to retrieve the USD historical prices that match the requested timeframe and cadence. Do not use Dexscreener for historical data. Calculate how many tokens would be purchased each interval, the total invested capital, total tokens accumulated, the current portfolio value, and the average purchase price.

If any tool call fails or data is missing, continue with the best available estimate without asking the user for more input.

Respond with valid JSON only using this schema (no Markdown):
{
  "summary": string,
  "prices": Array<{"date": string, "price": number}>,
  "dca": {
    "totalInvested": number,
    "totalTokens": number,
    "currentValue": number,
    "averagePrice": number
  }
}

Ensure the prices array contains the historical data needed to draw a chart (daily points are sufficient).`;
}

function normalizePrices(value: unknown): PricePoint[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const candidate = entry as Record<string, unknown>;
      const dateValue = candidate.date ?? candidate.timestamp ?? candidate.time;
      const priceValue = candidate.price ?? candidate.close ?? candidate.value;

      if (typeof dateValue !== "string") {
        return null;
      }

      const parsedPrice =
        typeof priceValue === "number"
          ? priceValue
          : Number.parseFloat(typeof priceValue === "string" ? priceValue : "");

      if (!Number.isFinite(parsedPrice)) {
        return null;
      }

      return { date: dateValue, price: parsedPrice } as PricePoint;
    })
    .filter((point): point is PricePoint => Boolean(point));
}

function normalizeMetrics(value: unknown): DcaMetrics | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as Record<string, unknown>;
  const mapNumber = (input: unknown) => {
    if (typeof input === "number") {
      return Number.isFinite(input) ? input : undefined;
    }

    if (typeof input === "string" && input.trim() !== "") {
      const parsed = Number.parseFloat(input);
      return Number.isFinite(parsed) ? parsed : undefined;
    }

    return undefined;
  };

  const totalInvested = mapNumber(candidate.totalInvested ?? candidate.total_invested);
  const totalTokens = mapNumber(candidate.totalTokens ?? candidate.total_tokens);
  const currentValue = mapNumber(candidate.currentValue ?? candidate.current_value);
  const averagePrice = mapNumber(candidate.averagePrice ?? candidate.average_price);

  if (
    totalInvested === undefined &&
    totalTokens === undefined &&
    currentValue === undefined &&
    averagePrice === undefined
  ) {
    return undefined;
  }

  return {
    totalInvested,
    totalTokens,
    currentValue,
    averagePrice,
  };
}

function parseNovaResponse(rawPayload: string, fallback: string): {
  summary: string;
  prices: PricePoint[];
  metrics?: DcaMetrics;
} {
  let summary = rawPayload.trim() || fallback;
  let prices: PricePoint[] = [];
  let metrics: DcaMetrics | undefined;

  const visited = new WeakSet<object>();

  const inspect = (value: unknown) => {
    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        summary = trimmed;
      }

      const firstChar = trimmed[0];
      if (firstChar === "{" || firstChar === "[") {
        try {
          const parsed = JSON.parse(trimmed);
          inspect(parsed);
        } catch {
          /* ignore malformed JSON embedded in string */
        }
      }

      return;
    }

    if (typeof value !== "object") {
      return;
    }

    const objectValue = value as Record<string, unknown>;

    if (visited.has(objectValue)) {
      return;
    }

    visited.add(objectValue);

    if (typeof objectValue.summary === "string" && objectValue.summary.trim() !== "") {
      summary = objectValue.summary.trim();
    }

    const candidatePrices = normalizePrices(
      objectValue.prices ?? objectValue.priceHistory ?? objectValue.history ?? objectValue.data,
    );

    if (candidatePrices.length > 0) {
      prices = candidatePrices;
    }

    const candidateMetrics = normalizeMetrics(
      objectValue.dca ?? objectValue.metrics ?? objectValue.analysis ?? objectValue.results,
    );

    if (candidateMetrics) {
      metrics = candidateMetrics;
    }

    const nestedCandidates = [
      objectValue.output,
      objectValue.message,
      objectValue.result,
      objectValue.response,
      objectValue.data,
    ];

    for (const candidate of nestedCandidates) {
      inspect(candidate);
    }
  };

  inspect(rawPayload);

  if (prices.length === 0) {
    const jsonMatch = rawPayload.match(/([\[{][\s\S]*[\]}])/);
    if (jsonMatch) {
      try {
        inspect(JSON.parse(jsonMatch[0]));
      } catch {
        /* swallow parse errors */
      }
    }
  }

  if (!summary || summary.trim() === "") {
    summary = fallback;
  }

  if (prices.length > 1) {
    prices = [...prices].sort((a, b) => {
      const left = Date.parse(a.date);
      const right = Date.parse(b.date);

      if (Number.isNaN(left) || Number.isNaN(right)) {
        return 0;
      }

      return left - right;
    });
  }

  return { summary, prices, metrics };
}

export function DcaCalculatorSection() {
  const [form, setForm] = useState<FormState>({
    token: "BTC",
    amount: "50",
    interval: "weekly",
    durationValue: "3",
    durationUnit: "months",
  });
  const [novaStatus, setNovaStatus] = useState<NovaStatus>({ status: "idle" });

  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const previewDurationLabel = useMemo(() => {
    const numericValue = Math.max(Number.parseInt(form.durationValue, 10) || 0, 1);
    return formatDuration(numericValue, form.durationUnit);
  }, [form.durationUnit, form.durationValue]);

  useEffect(() => {
    if (!chartCanvasRef.current) {
      return;
    }

    if (novaStatus.status !== "success" || novaStatus.analysis.prices.length === 0) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      return;
    }

    const context = chartCanvasRef.current.getContext("2d");

    if (!context) {
      return;
    }

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const labels = novaStatus.analysis.prices.map((point) => {
      const timestamp = Date.parse(point.date);
      if (Number.isNaN(timestamp)) {
        return point.date;
      }

      return new Date(timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    });

    const dataPoints = novaStatus.analysis.prices.map((point) => point.price);

    chartInstanceRef.current = new Chart(context, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: `${novaStatus.analysis.token.toUpperCase()} price`,
            data: dataPoints,
            borderColor: "rgba(16, 185, 129, 1)",
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            fill: true,
            tension: 0.35,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: "#cbd5f5",
              font: {
                size: 12,
              },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: "#94a3b8",
              maxTicksLimit: 6,
            },
            grid: {
              color: "rgba(148, 163, 184, 0.15)",
            },
          },
          y: {
            ticks: {
              color: "#94a3b8",
              callback: (value) => (typeof value === "number" ? `$${value}` : `${value}`),
            },
            grid: {
              color: "rgba(148, 163, 184, 0.15)",
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [novaStatus]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const apiUrl = process.env.NEXT_PUBLIC_NOVA_API_URL?.replace(/\/$/, "");
    const apiKey = process.env.NEXT_PUBLIC_NOVA_API_KEY;

    const requestForm: FormState = { ...form };
    const amountValue = Number.parseFloat(requestForm.amount);
    const durationValue = Number.parseInt(requestForm.durationValue, 10);
    const requestDurationLabel = formatDuration(Math.max(durationValue || 0, 1), requestForm.durationUnit);

    if (!apiUrl || !apiKey) {
      setNovaStatus({
        status: "error",
        message: "Nova configuration is missing. Please set NEXT_PUBLIC_NOVA_API_URL and NEXT_PUBLIC_NOVA_API_KEY.",
      });
      return;
    }

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setNovaStatus({
        status: "error",
        message: "Enter a recurring amount greater than zero to run the analysis.",
      });
      return;
    }

    if (!Number.isFinite(durationValue) || durationValue <= 0) {
      setNovaStatus({
        status: "error",
        message: "Duration must be at least 1 interval.",
      });
      return;
    }

    const requestId = `dca-${Date.now()}`;
    setNovaStatus({ status: "pending", requestId });

    const prompt = createNovaPrompt(requestForm, requestDurationLabel);

    try {
      const response = await fetch(`${apiUrl}/ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          prompt,
          metadata: {
            source: "dca-calculator",
            form: requestForm,
            interval: requestForm.interval,
            duration: requestDurationLabel,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setNovaStatus({
          status: "error",
          requestId,
          message: errorText || fallbackMessage,
        });
        return;
      }

      const rawPayload = await response.text();

      if (!rawPayload) {
        setNovaStatus({
          status: "error",
          requestId,
          message: fallbackMessage,
        });
        return;
      }

      const parsed = parseNovaResponse(rawPayload, fallbackMessage);

      setNovaStatus({
        status: "success",
        requestId,
        analysis: {
          token: requestForm.token,
          summary: parsed.summary,
          prices: parsed.prices,
          metrics: parsed.metrics,
          interval: requestForm.interval,
          durationLabel: requestDurationLabel,
        },
      });
    } catch (error) {
      setNovaStatus({
        status: "error",
        requestId,
        message:
          error instanceof Error && error.message ? error.message : fallbackMessage,
      });
    }
  };

  const handleFormChange = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-lg shadow-black/10">
        <header className="mb-6">
          <div className="inline-flex items-center rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-mint">
            Nova powered
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-white">Model a recurring buy plan</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Describe the cadence of your contributions and let Nova fetch price history, compute totals, and surface a quick readout.
          </p>
        </header>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="space-y-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Token symbol</span>
            <input
              type="text"
              value={form.token}
              onChange={(event) => handleFormChange("token", event.target.value.toUpperCase())}
              className="w-full rounded-xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-mint"
              placeholder="e.g. BTC"
              required
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Recurring amount (USD)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(event) => handleFormChange("amount", event.target.value)}
              className="w-full rounded-xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-mint"
              placeholder="50"
              required
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Interval</span>
            <select
              value={form.interval}
              onChange={(event) => handleFormChange("interval", event.target.value as DcaInterval)}
              className="w-full appearance-none rounded-xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-mint"
            >
              {Object.entries(intervalLabels).map(([value, label]) => (
                <option key={value} value={value} className="bg-slate-900">
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <label className="space-y-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Duration</span>
              <input
                type="number"
                min="1"
                step="1"
                value={form.durationValue}
                onChange={(event) => handleFormChange("durationValue", event.target.value)}
                className="w-full rounded-xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-mint"
                placeholder="3"
                required
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Duration unit</span>
              <select
                value={form.durationUnit}
                onChange={(event) => handleFormChange("durationUnit", event.target.value as DurationUnit)}
                className="w-full appearance-none rounded-xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-mint"
              >
                {Object.entries(durationUnitLabels).map(([value, label]) => (
                  <option key={value} value={value} className="bg-slate-900">
                    {label.plural}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 text-xs text-slate-400">
            <p className="font-semibold text-slate-200">Nova prompt preview</p>
            <p>
              Buy ${form.amount || 0} of {form.token || "?"} every {intervalLabels[form.interval].toLowerCase()} for the last {previewDurationLabel}.
            </p>
            <p className="text-[11px] text-slate-500">
              Nova pulls CoinDesk history, models fills per interval, and returns totals plus price data for charting.
            </p>
          </div>
          <Button type="submit" variant="gradient" className="w-full justify-center py-3 text-sm font-semibold">
            Calculate with Nova
          </Button>
        </form>
      </section>
      <section className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-lg shadow-black/10">
        <header className="mb-6">
          <h3 className="text-2xl font-semibold text-white">DCA results</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            See how much capital would be deployed, how many tokens accumulate, and how price has moved over the selected window.
          </p>
        </header>
        <div className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mint/20 text-sm font-semibold uppercase text-mint">
              N
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Nova analysis</p>
              <p className="text-xs text-slate-400">
                Responses leverage CoinDesk history and Nova tooling so you can sanity-check DCA deployments quickly.
              </p>
            </div>
          </div>
          {novaStatus.status === "idle" ? (
            <p className="text-sm text-slate-300">
              Enter a token, contribution amount, interval, and duration to generate a backtest.
            </p>
          ) : null}
          {novaStatus.status === "pending" ? (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 text-sm text-slate-300">
              <svg className="h-5 w-5 animate-spin text-mint" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span>Waiting on Nova to crunch the numbers...</span>
            </div>
          ) : null}
          {novaStatus.status === "error" ? (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
              {novaStatus.message}
            </div>
          ) : null}
          {novaStatus.status === "success" ? (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {novaStatus.analysis.metrics?.totalInvested !== undefined ? (
                  <div className="rounded-2xl border border-mint/40 bg-mint/10 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-mint">Total invested</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {usdFormatter.format(novaStatus.analysis.metrics.totalInvested)}
                    </p>
                  </div>
                ) : null}
                {novaStatus.analysis.metrics?.currentValue !== undefined ? (
                  <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Current value</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {usdFormatter.format(novaStatus.analysis.metrics.currentValue)}
                    </p>
                  </div>
                ) : null}
                {novaStatus.analysis.metrics?.totalTokens !== undefined ? (
                  <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Total tokens</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {tokenFormatter.format(novaStatus.analysis.metrics.totalTokens)} {novaStatus.analysis.token.toUpperCase()}
                    </p>
                  </div>
                ) : null}
                {novaStatus.analysis.metrics?.averagePrice !== undefined ? (
                  <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Average purchase price</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {usdFormatter.format(novaStatus.analysis.metrics.averagePrice)}
                    </p>
                  </div>
                ) : null}
              </div>
              <article className="space-y-3 rounded-2xl border border-mint/40 bg-mint/10 p-4 text-sm text-mint-100">
                {novaStatus.analysis.summary.split(/\n+/).map((paragraph, index) => (
                  <p key={index} className="text-slate-100">
                    {paragraph}
                  </p>
                ))}
              </article>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
                <header className="mb-4 flex flex-col gap-1 text-sm">
                  <p className="font-semibold text-white">Price history</p>
                  <p className="text-xs text-slate-400">
                    {novaStatus.analysis.token.toUpperCase()} • {intervalLabels[novaStatus.analysis.interval]} buys over the last {novaStatus.analysis.durationLabel}
                  </p>
                </header>
                <div className="h-64">
                  {novaStatus.analysis.prices.length > 0 ? (
                    <canvas ref={chartCanvasRef} aria-label="Historical price chart" role="img" />
                  ) : (
                    <p className="text-xs text-slate-400">
                      Nova did not return price data for this request. Try a shorter duration or different token.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
