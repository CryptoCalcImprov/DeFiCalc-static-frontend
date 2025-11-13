"use client";

import { useEffect, useMemo, useRef } from "react";
import type { ChartConfiguration } from "chart.js";

import type { CoinGeckoCandle } from "@/components/calculators/types";
import { CalculatorSpinner } from "@/components/calculators/workspace/CalculatorSpinner";
import { LoadingDots } from "@/components/ui/loading-dots";
import {
  estimateDriftAndVolatility,
  generateMonteCarloPath,
  MonteCarloHorizons,
  type MonteCarloHorizon,
  type MonteCarloTrajectoryPoint,
} from "@/lib/monte-carlo";

const PRICE_AXIS_DECIMAL_LIMIT = 6;

function formatPriceAxis(value: number): string {
  if (!Number.isFinite(value)) {
    return "$0";
  }

  const absValue = Math.abs(value);
  if (absValue >= 1) {
    return `$${value.toFixed(0)}`;
  }

  const decimals =
    absValue > 0
      ? Math.min(PRICE_AXIS_DECIMAL_LIMIT, Math.max(2, Math.ceil(-Math.log10(absValue))))
      : 2;

  return `$${value.toFixed(decimals)}`;
}

type ChartConstructor = typeof import("chart.js/auto") extends { default: infer T } ? T : never;
type ChartInstance = ChartConstructor extends new (...args: any[]) => infer R ? R : never;

export type PriceTrajectoryOverlay = {
  id: string;
  label: string;
  data: { x: number; y: number }[];
  color: string;
  backgroundColor?: string;
  borderDash?: number[];
  strokeWidth?: number;
  tension?: number;
  fill?: boolean;
  pointRadius?: number;
  yAxisID?: string;
  order?: number;
};

export type PriceTrajectoryEventMarker = {
  id: string;
  label: string;
  points: { x: number; y: number }[];
  backgroundColor: string;
  borderColor: string;
  radius?: number;
  yAxisID?: string;
};

type PriceTrajectoryPanelProps = {
  title?: string;
  dataset: CoinGeckoCandle[];
  isLoading: boolean;
  seriesLabel: string;
  loadingMessage?: string;
  emptyMessage?: string;
  technicalOverlays?: PriceTrajectoryOverlay[];
  eventMarkers?: PriceTrajectoryEventMarker[];
  onMonteCarloPath?: (trajectory: MonteCarloTrajectoryPoint[] | null) => void;
  monteCarloHorizon?: MonteCarloHorizon;
};

export function PriceTrajectoryPanel({
  title = "Price trajectory",
  dataset,
  isLoading,
  seriesLabel,
  loadingMessage = "Fetching price history from CoinGecko...",
  emptyMessage = "Run the projection to visualize one year of CoinGecko price history.",
  technicalOverlays = [],
  eventMarkers = [],
  onMonteCarloPath,
  monteCarloHorizon,
}: PriceTrajectoryPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);

  const hasDataset = dataset.length > 0;

  const monteCarloOverlay = useMemo(() => {
    if (!dataset.length) {
      return null;
    }

    const closes = dataset.map((candle) => candle.close);
    const stats = estimateDriftAndVolatility(closes);
    if (!stats) {
      return null;
    }

    const latestCandle = dataset[dataset.length - 1];
    const horizonMonths = monteCarloHorizon ?? MonteCarloHorizons.SIX_MONTHS;
    const trajectory = generateMonteCarloPath({
      startPrice: latestCandle.close,
      startTimestamp: new Date(latestCandle.date).getTime(),
      drift: stats.drift,
      volatility: stats.volatility,
      config: {
        horizonMonths,
        stepDays: 1,
        seed: 13579,
      },
    });

    if (!trajectory.length) {
      return null;
    }

    return {
      id: "monte-carlo-path",
      label: "Monte Carlo projection",
      data: trajectory,
      color: "#FBA94C",
      backgroundColor: "rgba(251, 169, 76, 0.15)",
      strokeWidth: 2.5,
      borderDash: [6, 4],
      tension: 0.3,
      pointRadius: 0,
      fill: false,
      yAxisID: undefined,
      order: 50,
    };
  }, [dataset, monteCarloHorizon]);

  useEffect(() => {
    const trajectory = (monteCarloOverlay?.data ?? null) as MonteCarloTrajectoryPoint[] | null;
    onMonteCarloPath?.(trajectory);
  }, [monteCarloOverlay, onMonteCarloPath]);

  const overlaysForRendering = useMemo(() => {
    if (!monteCarloOverlay) {
      return technicalOverlays;
    }

    return [...technicalOverlays, monteCarloOverlay];
  }, [technicalOverlays, monteCarloOverlay]);

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

        const overlayDatasets = [...overlaysForRendering]
          .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
          .map((overlay) => ({
            type: "line" as const,
            label: overlay.label,
            data: overlay.data,
            borderColor: overlay.color,
            borderWidth: overlay.strokeWidth ?? 2,
            backgroundColor: overlay.backgroundColor ?? "rgba(0,0,0,0)",
          fill: overlay.fill ?? false,
          tension: overlay.tension ?? 0.25,
          borderDash: overlay.borderDash,
          pointRadius: overlay.pointRadius ?? 0,
          yAxisID: overlay.yAxisID ?? "y",
        }));

        const markerDatasets = eventMarkers.map((marker) => ({
          type: "bubble" as const,
          label: marker.label,
          data: marker.points.map((point) => ({ x: point.x, y: point.y, r: marker.radius ?? 5 })),
          backgroundColor: marker.backgroundColor,
          borderColor: marker.borderColor,
          borderWidth: 2,
          showLine: false,
          yAxisID: marker.yAxisID ?? "y",
        }));

        const config: ChartConfiguration = {
          type: "candlestick",
          data: {
            datasets: [
              {
                type: "candlestick",
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
              ...overlayDatasets,
              ...markerDatasets,
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
                    const datasetType = context.dataset.type;

                    if (datasetType === "candlestick") {
                      const point = context.raw as { o: number; h: number; l: number; c: number };
                      return [
                        `Open: $${point.o.toFixed(2)}`,
                        `High: $${point.h.toFixed(2)}`,
                        `Low: $${point.l.toFixed(2)}`,
                        `Close: $${point.c.toFixed(2)}`,
                      ];
                    }

                    const value = context.parsed?.y ?? context.raw?.y;
                    const label = context.dataset.label ?? "Value";

                    if (typeof value === "number") {
                      return `${label}: $${value.toFixed(2)}`;
                    }

                    return label;
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
                    return formatPriceAxis(Number(value));
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
  }, [dataset, hasDataset, seriesLabel, overlaysForRendering, eventMarkers]);

  return (
    <div className="card-surface rounded-2xl bg-gradient-to-br from-slate-950/70 via-slate-950/50 to-slate-900/25 p-4 sm:rounded-3xl sm:p-6">
      <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-100 sm:text-sm">{title}</h4>
      <div className="mt-3 h-72 min-w-0 rounded-2xl border border-ocean/60 bg-surface/75 sm:mt-4 sm:h-96 lg:h-[28rem]">
        {hasDataset ? (
          <div className="h-full w-full overflow-x-auto overflow-y-hidden">
            <div
              className="h-full"
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
