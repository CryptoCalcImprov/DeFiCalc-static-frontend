"use client";

import { useEffect, useRef } from "react";
import type { ChartConfiguration } from "chart.js";

import { CalculatorSpinner } from "@/components/calculators/workspace/CalculatorSpinner";

type ChartConstructor = typeof import("chart.js/auto") extends { default: infer T } ? T : never;
type ChartInstance = ChartConstructor extends new (...args: any[]) => infer R ? R : never;

export type TrendFollowingDataPoint = {
  date: string;
  price: number;
  ma: number;
  portfolioEquity: number;
  hodlValue: number;
};

type TrendFollowingChartProps = {
  title?: string;
  dataset: TrendFollowingDataPoint[];
  isLoading: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  token: string;
};

export function TrendFollowingChart({
  title = "Price trajectory & portfolio equity",
  dataset,
  isLoading,
  loadingMessage = "Asking Nova for price history...",
  emptyMessage = "Run the projection to visualize Nova's modeled price path.",
  token,
}: TrendFollowingChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);

  const hasDataset = dataset.length > 0;

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
                label: `${token} Price`,
                data: dataset.map((point) => point.price),
                borderColor: "rgba(58, 198, 255, 0.95)",
                backgroundColor: "rgba(58, 198, 255, 0.14)",
                tension: 0.32,
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 6,
                yAxisID: "y",
              },
              {
                label: `Moving Average`,
                data: dataset.map((point) => point.ma),
                borderColor: "rgba(147, 197, 253, 0.7)",
                backgroundColor: "rgba(147, 197, 253, 0.1)",
                tension: 0.32,
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 6,
                borderDash: [5, 5],
                yAxisID: "y",
              },
              {
                label: "Strategy Portfolio Equity",
                data: dataset.map((point) => point.portfolioEquity),
                borderColor: "rgba(54, 214, 195, 0.95)",
                backgroundColor: "rgba(54, 214, 195, 0.14)",
                tension: 0.32,
                fill: false,
                pointRadius: 3,
                pointHoverRadius: 8,
                pointBackgroundColor: "#36D6C3",
                pointBorderColor: "#041A2A",
                pointBorderWidth: 2,
                yAxisID: "y1",
              },
              {
                label: "HODL Baseline",
                data: dataset.map((point) => point.hodlValue),
                borderColor: "rgba(148, 163, 184, 0.6)",
                backgroundColor: "rgba(148, 163, 184, 0.08)",
                tension: 0.32,
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 6,
                borderDash: [3, 3],
                yAxisID: "y1",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: "index",
              intersect: false,
            },
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
                type: "linear",
                display: true,
                position: "left",
                ticks: {
                  color: "#94A3B8",
                },
                grid: {
                  color: "rgba(19, 44, 63, 0.45)",
                },
                title: {
                  display: true,
                  text: "Price (USD)",
                  color: "#94A3B8",
                },
              },
              y1: {
                type: "linear",
                display: true,
                position: "right",
                ticks: {
                  color: "#94A3B8",
                },
                grid: {
                  drawOnChartArea: false,
                },
                title: {
                  display: true,
                  text: "Portfolio Value (USD)",
                  color: "#94A3B8",
                },
              },
            },
          },
        };

        chartRef.current = new ChartJs(canvas, config);
      } catch (error) {
        console.error("Failed to render trend-following chart", error);
      }
    };

    void renderChart();

    return () => {
      isMounted = false;
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [dataset, hasDataset, token]);

  return (
    <div className="card-surface rounded-2xl bg-gradient-to-br from-slate-950/70 via-slate-950/50 to-slate-900/25 p-4 sm:rounded-3xl sm:p-6">
      <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-100 sm:text-sm">{title}</h4>
      <div className="mt-3 h-56 min-w-0 overflow-hidden rounded-2xl border border-ocean/60 bg-surface/75 sm:mt-4 sm:h-72 lg:h-96">
        {hasDataset ? (
          <canvas ref={canvasRef} className="h-full w-full max-w-full" style={{ width: "100%", height: "100%" }} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ocean/55 bg-surface/65 px-6 text-center">
            {isLoading ? (
              <>
                <CalculatorSpinner size={56} />
                <p className="text-xs font-semibold uppercase tracking-widest text-mint/80 sm:text-sm">
                  Rendering price path…
                </p>
                <p className="text-xs text-muted sm:text-sm">{loadingMessage}</p>
              </>
            ) : (
              <p className="text-sm text-muted">{emptyMessage}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

