"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
const PRICE_TOOLTIP_DECIMAL_LIMIT = 4;
const PRICE_TOOLTIP_EXTENDED_DECIMALS = 8;
const PRICE_TOOLTIP_ZERO_THRESHOLD = 4;
const TOOLTIP_POSITIONER_ID = "cursorOffset";

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

function formatTooltipPrice(value: number): string {
  if (!Number.isFinite(value)) {
    return "$0.00";
  }

  const absValue = Math.abs(value);
  let decimals = PRICE_TOOLTIP_DECIMAL_LIMIT;

  const formattedAbs = Math.abs(value).toFixed(PRICE_TOOLTIP_DECIMAL_LIMIT);
  const fractionPart = formattedAbs.split(".")[1];
  const firstZerosZero =
    typeof fractionPart === "string" &&
    fractionPart.slice(0, PRICE_TOOLTIP_ZERO_THRESHOLD) === "0".repeat(PRICE_TOOLTIP_ZERO_THRESHOLD);

  if (firstZerosZero) {
    decimals = Math.max(decimals, PRICE_TOOLTIP_EXTENDED_DECIMALS);
  }

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

type StrategyPointMeta = {
  action?: string;
  description?: string;
  amount?: number;
  price?: number;
  quantity?: number;
  date?: string;
};

type PriceTrajectoryEventPoint = {
  x: number;
  y: number;
  meta?: StrategyPointMeta;
};

export type PriceTrajectoryEventMarker = {
  id: string;
  label: string;
  points: PriceTrajectoryEventPoint[];
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
  const tooltipModeRef = useRef<"strategy" | "technical">("strategy");
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

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
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let longPressTimer: ReturnType<typeof setTimeout> | null = null;
    let longPressPosition: { clientX: number; clientY: number } | null = null;

    const clearLongPress = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      longPressPosition = null;
    };

    const hideTechnicalTooltip = () => {
      if (tooltipModeRef.current !== "technical") {
        return;
      }
      const chart = chartRef.current;
      if (!chart || !chart.tooltip) {
        return;
      }
      tooltipModeRef.current = "strategy";
      chart.tooltip.setActiveElements([], { x: 0, y: 0 });
      chart.setActiveElements([]);
      chart.update();
    };

    const showTechnicalTooltip = (coords: { clientX: number; clientY: number }) => {
      const chart = chartRef.current;
      const currentCanvas = canvasRef.current;
      if (!chart || !currentCanvas || !chart.tooltip) {
        return;
      }

      const rect = currentCanvas.getBoundingClientRect();
      const relativeX = coords.clientX - rect.left;
      const relativeY = coords.clientY - rect.top;

      const syntheticEvent = {
        type: "custom",
        x: relativeX,
        y: relativeY,
        native: {
          offsetX: relativeX,
          offsetY: relativeY,
        },
      } as unknown as Event;

      const elements = chart.getElementsAtEventForMode(
        syntheticEvent,
        "index",
        { axis: "x", intersect: false },
        false,
      );

      if (!elements.length) {
        return;
      }

      tooltipModeRef.current = "technical";
      chart.setActiveElements(elements);
      chart.tooltip.setActiveElements(elements, { x: relativeX, y: relativeY });
      chart.update();
    };

    const handleDoubleClick = (event: MouseEvent) => {
      event.preventDefault();
      showTechnicalTooltip({ clientX: event.clientX, clientY: event.clientY });
    };

  const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch") {
        hideTechnicalTooltip();
        return;
      }

      hideTechnicalTooltip();
      longPressPosition = { clientX: event.clientX, clientY: event.clientY };
      longPressTimer = setTimeout(() => {
        if (longPressPosition) {
          showTechnicalTooltip(longPressPosition);
        }
        clearLongPress();
      }, 500);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (longPressPosition && event.pointerType === "touch") {
        const deltaX = Math.abs(event.clientX - longPressPosition.clientX);
        const deltaY = Math.abs(event.clientY - longPressPosition.clientY);
        if (deltaX > 12 || deltaY > 12) {
          clearLongPress();
        }
      } else if (tooltipModeRef.current === "technical" && event.pointerType !== "touch") {
        hideTechnicalTooltip();
      }
    };

    const handlePointerUp = () => {
      clearLongPress();
    };

    const handlePointerLeave = () => {
      clearLongPress();
      hideTechnicalTooltip();
    };

    const handleWheel = () => {
      hideTechnicalTooltip();
    };

    canvas.addEventListener("dblclick", handleDoubleClick);
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);
    canvas.addEventListener("wheel", handleWheel, { passive: true });

    return () => {
      canvas.removeEventListener("dblclick", handleDoubleClick);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      canvas.removeEventListener("wheel", handleWheel);
      clearLongPress();
    };
  }, [hasDataset]);


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
        const [chartModule, financialModule, timeAdapterModule, zoomModule] = await Promise.all([
          import("chart.js/auto"),
          import("chartjs-chart-financial"),
          import("chartjs-adapter-date-fns"),
          import("chartjs-plugin-zoom"),
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
        if (zoomModule?.default) {
          ChartJs.register(zoomModule.default);
        }
        registerCursorOffsetTooltip(ChartJs, chartModule as Record<string, unknown>);

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
          data: marker.points.map((point) => ({
            x: point.x,
            y: point.y,
            r: marker.radius ?? 5,
            meta: point.meta,
          })),
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
            interaction: {
              mode: "nearest",
              intersect: true,
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
                position: TOOLTIP_POSITIONER_ID as never,
                caretPadding: 12,
                filter: (tooltipItem) => {
                  const datasetType = tooltipItem.dataset.type;
                  if (tooltipModeRef.current === "technical") {
                    return datasetType !== "bubble";
                  }
                  return datasetType === "bubble";
                },
                callbacks: {
                  title: (items) => {
                    const first = items[0];
                    if (!first) {
                      return "";
                    }
                    if (tooltipModeRef.current === "technical") {
                      const parsedTimestamp =
                        typeof first.parsed?.x === "number" ? first.parsed.x : undefined;
                      const rawTimestamp =
                        typeof (first.raw as Record<string, unknown> | undefined)?.x === "number"
                          ? (first.raw as Record<string, number>).x
                          : undefined;
                      const timestamp =
                        parsedTimestamp !== undefined ? parsedTimestamp : rawTimestamp ?? null;
                      if (typeof timestamp === "number" && Number.isFinite(timestamp)) {
                        return new Date(timestamp).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                      }
                      return first.label ?? "";
                    }
                    const rawPoint = first.raw as { x?: number; meta?: StrategyPointMeta };
                    if (rawPoint?.meta?.date) {
                      return rawPoint.meta.date;
                    }
                    const timestamp = typeof rawPoint?.x === "number" ? rawPoint.x : first.parsed?.x;
                    if (typeof timestamp === "number" && Number.isFinite(timestamp)) {
                      return new Date(timestamp).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                    }
                    return first.label ?? "";
                  },
                  label: (context) => {
                    if (tooltipModeRef.current === "technical") {
                      const datasetType = context.dataset.type;
                      if (datasetType === "candlestick") {
                        const point = context.raw as { o: number; h: number; l: number; c: number };
                        return [
                          `Open: ${formatTooltipPrice(point.o)}`,
                          `High: ${formatTooltipPrice(point.h)}`,
                          `Low: ${formatTooltipPrice(point.l)}`,
                          `Close: ${formatTooltipPrice(point.c)}`,
                        ];
                      }
                      const rawValue =
                        typeof (context.raw as Record<string, unknown> | undefined)?.y === "number"
                          ? (context.raw as Record<string, number>).y
                          : undefined;
                      const value =
                        typeof context.parsed?.y === "number" ? context.parsed?.y : rawValue;
                      const label = context.dataset.label ?? "Value";
                      if (typeof value === "number") {
                        return `${label}: ${formatTooltipPrice(value)}`;
                      }
                      return label;
                    }
                    const datasetLabel = context.dataset.label ?? "Strategy action";
                    const rawPoint = context.raw as { y?: number; meta?: StrategyPointMeta };
                    const meta = rawPoint?.meta ?? {};
                    const lines: string[] = [];

                    if (meta.action) {
                      lines.push(meta.action);
                    } else {
                      lines.push(datasetLabel);
                    }

                    const price = typeof meta.price === "number" ? meta.price : context.parsed?.y;
                    if (typeof price === "number" && Number.isFinite(price)) {
                      lines.push(`Price: ${formatTooltipPrice(price)}`);
                    }

                    if (typeof meta.amount === "number" && Number.isFinite(meta.amount)) {
                      lines.push(`Amount: $${meta.amount.toFixed(2)}`);
                    }

                    if (typeof meta.quantity === "number" && Number.isFinite(meta.quantity)) {
                      lines.push(`Quantity: ${meta.quantity.toFixed(4)}`);
                    }

                    if (meta.description) {
                      lines.push(meta.description);
                    }

                    return lines;
                  },
                },
              },
              zoom: {
                pan: {
                  enabled: true,
                  mode: "x",
                  modifierKey: undefined,
                },
                zoom: {
                  wheel: {
                    enabled: true,
                  },
                  pinch: {
                    enabled: true,
                  },
                  drag: {
                    enabled: true,
                    modifierKey: "shift",
                    backgroundColor: "rgba(56, 189, 248, 0.15)",
                    borderWidth: 1,
                    borderColor: "rgba(56, 189, 248, 0.65)",
                  },
                  mode: "x",
                },
                limits: {
                  x: {
                    min: "original",
                    max: "original",
                  },
                  y: {
                    min: "original",
                    max: "original",
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
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-100 sm:text-sm">{title}</h4>
        <button
          type="button"
          onClick={() => setIsInstructionsOpen(true)}
          className="rounded-full border border-slate-700/80 bg-slate-900/60 px-2 py-1 text-xs font-semibold text-slate-200 transition hover:border-mint/70 hover:text-mint focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/70"
          aria-label="Show chart controls"
        >
          ?
        </button>
      </div>
      <div className="mt-3 h-72 min-w-0 rounded-2xl border border-ocean/60 bg-surface/75 sm:mt-4 sm:h-96 lg:h-[28rem]">
        {hasDataset ? (
          <div className="h-full w-full overflow-hidden">
            <canvas
              ref={canvasRef}
              className="h-full w-full"
              style={{ width: "100%", height: "100%" }}
            />
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
      {isInstructionsOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8">
          <div className="w-full max-w-lg rounded-2xl border border-ocean/70 bg-slate-950 p-6 text-sm text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between">
              <h5 className="text-base font-semibold uppercase tracking-widest text-mint">Chart controls</h5>
              <button
                type="button"
                onClick={() => setIsInstructionsOpen(false)}
                className="rounded-full border border-slate-700/70 px-2 py-1 text-xs font-semibold text-slate-200 hover:border-mint/70 hover:text-mint focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/70"
                aria-label="Close chart control instructions"
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Mouse & trackpad</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-200">
                  <li>• Drag to pan the chart.</li>
                  <li>• Scroll wheel pinches to zoom in/out.</li>
                  <li>• Hold Shift + drag to box zoom.</li>
                  <li>• Double-click any point to view the technical snapshot.</li>
                  <li>• Hover strategy markers to see the recommended action.</li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Touch screens</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-200">
                  <li>• Swipe with one finger to pan.</li>
                  <li>• Pinch with two fingers to zoom.</li>
                  <li>• Long press anywhere to show technical details.</li>
                  <li>• Tap strategy markers to reveal their actions.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
function registerCursorOffsetTooltip(ChartJs: ChartConstructor, chartModule: Record<string, unknown>) {
  const TooltipClass = (chartModule as any).Tooltip ?? (ChartJs as any).Tooltip;
  if (!TooltipClass?.positioners) {
    return;
  }

  if (TooltipClass.positioners[TOOLTIP_POSITIONER_ID]) {
    return;
  }

  TooltipClass.positioners[TOOLTIP_POSITIONER_ID] = function (_items: unknown[], eventPosition: { x: number; y: number }) {
    if (!eventPosition || typeof eventPosition.x !== "number" || typeof eventPosition.y !== "number") {
      return false;
    }

    // `this` refers to the tooltip instance
    const tooltip: any = this;
    const chart = tooltip?.chart;
    const chartArea = chart?.chartArea;
    if (!chartArea) {
      return eventPosition;
    }

    const padding = 16;
    const tooltipWidth = tooltip?.width ?? 0;
    const tooltipHeight = tooltip?.height ?? 0;
    const halfWidth = tooltipWidth / 2;
    const halfHeight = tooltipHeight / 2;

    let targetX = eventPosition.x + padding;
    let targetY = eventPosition.y;

    const minX = chartArea.left + 4;
    const maxX = chartArea.right - tooltipWidth - 4;
    const minY = chartArea.top + halfHeight + 4;
    const maxY = chartArea.bottom - halfHeight - 4;

    targetX = Math.min(Math.max(targetX, minX), maxX);
    targetY = Math.min(Math.max(targetY, minY), maxY);

    return {
      x: targetX,
      y: targetY,
    };
  };
}
