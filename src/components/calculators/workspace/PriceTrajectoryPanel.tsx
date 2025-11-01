"use client";

import { useEffect, useRef } from "react";
import type { ChartConfiguration } from "chart.js";

import type { TimeSeriesPoint } from "@/components/calculators/types";

type ChartConstructor = typeof import("chart.js/auto") extends { default: infer T } ? T : never;
type ChartInstance = ChartConstructor extends new (...args: any[]) => infer R ? R : never;

type PriceTrajectoryPanelProps = {
  title?: string;
  dataset: TimeSeriesPoint[];
  isLoading: boolean;
  seriesLabel: string;
  loadingMessage?: string;
  emptyMessage?: string;
};

export function PriceTrajectoryPanel({
  title = "Price trajectory",
  dataset,
  isLoading,
  seriesLabel,
  loadingMessage = "Asking Nova for price history...",
  emptyMessage = "Run the projection to visualize Nova's modeled price path.",
}: PriceTrajectoryPanelProps) {
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
                label: seriesLabel,
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
      } catch (error) {
        console.error("Failed to render price trajectory chart", error);
      }
    };

    void renderChart();

    return () => {
      isMounted = false;
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [dataset, hasDataset, seriesLabel]);

  return (
    <div className="card-surface rounded-2xl bg-gradient-to-br from-slate-950/70 via-slate-950/50 to-slate-900/25 p-4 sm:rounded-3xl sm:p-6">
      <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-100 sm:text-sm">{title}</h4>
      <div className="mt-3 h-56 min-w-0 overflow-hidden rounded-2xl border border-ocean/60 bg-surface/75 sm:mt-4 sm:h-72 lg:h-96">
        {hasDataset ? (
          <canvas ref={canvasRef} className="h-full w-full max-w-full" style={{ width: "100%", height: "100%" }} />
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-ocean/55 bg-surface/65 text-center text-sm text-muted">
            {isLoading ? loadingMessage : emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}
