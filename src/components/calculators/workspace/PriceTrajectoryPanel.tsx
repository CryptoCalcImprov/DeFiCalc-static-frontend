"use client";

import { useEffect, useRef } from "react";
import type { ChartConfiguration } from "chart.js";

import type { CoinGeckoCandle } from "@/components/calculators/types";
import { CalculatorSpinner } from "@/components/calculators/workspace/CalculatorSpinner";
import { LoadingDots } from "@/components/ui/loading-dots";

type ChartConstructor = typeof import("chart.js/auto") extends { default: infer T } ? T : never;
type ChartInstance = ChartConstructor extends new (...args: any[]) => infer R ? R : never;

type PriceTrajectoryPanelProps = {
  title?: string;
  dataset: CoinGeckoCandle[];
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
  loadingMessage = "Fetching price history from CoinGecko...",
  emptyMessage = "Run the projection to visualize one year of CoinGecko price history.",
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
        const [chartModule, financialModule, timeAdapterModule] = await Promise.all([
          import("chart.js/auto"),
          import("chartjs-chart-financial"),
          import("chartjs-adapter-date-fns"),
        ]);
        if (!isMounted || !canvas) {
          return;
        }

        const ChartJs = chartModule.default as ChartConstructor;

        // Register financial chart controller and element
        // chartjs-chart-financial exports CandlestickController and CandlestickElement
        const { CandlestickController, CandlestickElement } = financialModule as any;
        if (CandlestickController && CandlestickElement) {
          ChartJs.register(CandlestickController, CandlestickElement);
        }
        
        // Register time adapter for date formatting on x-axis
        if (timeAdapterModule?.default) {
          ChartJs.register(timeAdapterModule.default);
        }

        chartRef.current?.destroy();

        // Format data for candlestick chart: [timestamp, open, high, low, close]
        const candlestickData = dataset.map((candle) => {
          const timestamp = new Date(candle.date).getTime();
          return {
            x: timestamp,
            o: candle.open,
            h: candle.high,
            l: candle.low,
            c: candle.close,
          };
        });

        const config: ChartConfiguration<"candlestick", typeof candlestickData, string> = {
          type: "candlestick",
          data: {
            datasets: [
              {
                label: seriesLabel,
                data: candlestickData,
                borderColors: {
                  up: "#36D6C3", // Teal for bullish candles
                  down: "#EF4444", // Red for bearish candles
                  unchanged: "#94A3B8", // Gray for unchanged
                },
                backgroundColors: {
                  up: "rgba(54, 214, 195, 0.5)", // Teal with transparency for bullish candles
                  down: "rgba(239, 68, 68, 0.5)", // Red with transparency for bearish candles
                  unchanged: "rgba(148, 163, 184, 0.5)", // Gray with transparency for unchanged
                },
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
                callbacks: {
                  label: function (context: any) {
                    const point = context.raw;
                    return [
                      `Open: $${point.o.toFixed(2)}`,
                      `High: $${point.h.toFixed(2)}`,
                      `Low: $${point.l.toFixed(2)}`,
                      `Close: $${point.c.toFixed(2)}`,
                    ];
                  },
                },
              },
            },
            scales: {
              x: {
                type: "time",
                time: {
                  unit: undefined, // Let Chart.js auto-select the best unit
                  displayFormats: {
                    day: "MMM dd",
                    week: "MMM dd",
                    month: "MMM yyyy",
                  },
                },
                ticks: {
                  color: "#94A3B8",
                  maxRotation: 45,
                  minRotation: 45,
                  autoSkip: true,
                  maxTicksLimit: 15,
                  source: "data",
                },
                grid: {
                  color: "rgba(19, 44, 63, 0.45)",
                },
              },
              y: {
                ticks: {
                  color: "#94A3B8",
                  callback: function (value: any) {
                    return `$${Number(value).toFixed(0)}`;
                  },
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
      <div className="mt-3 h-56 min-w-0 rounded-2xl border border-ocean/60 bg-surface/75 sm:mt-4 sm:h-72 lg:h-96">
        {hasDataset ? (
          <div className="h-full w-full overflow-x-auto">
            <div
              className="min-h-full"
              style={{
                minWidth: `${Math.max(dataset.length * 12, 780)}px`,
              }}
            >
              <canvas
                ref={canvasRef}
                className="h-full w-full"
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ocean/55 bg-surface/65 px-6 text-center">
            {isLoading ? (
              <>
                <CalculatorSpinner size={56} />
                <LoadingDots
                  text="Rendering price path"
                  className="text-xs font-semibold uppercase tracking-widest text-mint/80 sm:text-sm"
                />
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
