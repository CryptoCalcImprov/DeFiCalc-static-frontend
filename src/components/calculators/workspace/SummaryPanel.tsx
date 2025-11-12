"use client";

import { useState } from "react";

import type {
  CalculatorDeterministicSummary,
  CalculatorInsight,
  CalculatorSummarySection,
} from "@/components/calculators/types";
import { CalculatorSpinner } from "@/components/calculators/workspace/CalculatorSpinner";
import { LoadingDots } from "@/components/ui/loading-dots";
import { MessageParser } from "@/components/ui/message-parser";

type SummaryPanelProps = {
  title?: string;
  deterministicSummary?: CalculatorDeterministicSummary;
  aiStatus?: "idle" | "pending" | "success" | "error";
  insight?: CalculatorInsight | null;
  fallbackLines?: string[];
  fallbackMessage?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  loadingMessage?: string;
};

function formatValue(value: unknown): string {
  if (value == null) {
    return "";
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
}

function renderList(items: string[] | undefined, bulletClassName = "bg-mint") {
  if (!items?.length) {
    return null;
  }

  return (
    <ul className="space-y-1.5 text-xs text-muted sm:text-sm">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex items-start gap-2">
          <span className={`mt-1 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full ${bulletClassName}`} aria-hidden />
          <MessageParser content={item} className="flex-1" />
        </li>
      ))}
    </ul>
  );
}

type StatusBadgeConfig = {
  label: string;
  className: string;
};

function resolveStatusBadge(aiStatus: SummaryPanelProps["aiStatus"]): StatusBadgeConfig | null {
  switch (aiStatus) {
    case "pending":
      return {
        label: "Nova insight pending",
        className: "border-amber-400/40 bg-amber-500/10 text-amber-200",
      };
    case "error":
      return {
        label: "Nova insight unavailable",
        className: "border-critical/40 bg-critical/10 text-critical",
      };
    case "success":
      return {
        label: "Nova insight ready",
        className: "border-mint/40 bg-mint/10 text-mint",
      };
    case "idle":
      return {
        label: "Deterministic preview",
        className: "border-slate-500/40 bg-slate-500/10 text-slate-300",
      };
    default:
      return null;
  }
}

function DeterministicSummaryCard({
  summary,
  aiStatus,
}: {
  summary: CalculatorDeterministicSummary;
  aiStatus?: SummaryPanelProps["aiStatus"];
}) {
  const { headline, description, metrics, footnotes } = summary;
  const statusBadge = resolveStatusBadge(aiStatus);

  return (
    <div className="rounded-2xl border border-ocean/45 bg-slate-950/50 p-4 shadow-inner shadow-[0_0_18px_rgba(7,24,36,0.18)] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        {headline ? <h4 className="text-sm font-semibold text-slate-100 sm:text-base">{headline}</h4> : null}
        {statusBadge ? (
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wide sm:text-xs ${statusBadge.className}`}
          >
            {statusBadge.label}
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="mt-2 text-xs text-slate-300 sm:text-sm">{description}</p>
      ) : null}
      {metrics?.length ? (
        <dl className="mt-4 grid gap-3 rounded-xl border border-ocean/35 bg-slate-950/55 p-3 sm:grid-cols-2 sm:p-4">
          {metrics.map((metric, index) => {
            const value = typeof metric.value === "string" ? metric.value : formatValue(metric.value);
            const unit = metric.unit ? ` ${metric.unit}` : "";
            return (
              <div key={`${metric.label}-${index}`}>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
                  {metric.label}
                </dt>
                <dd className="text-sm font-semibold text-slate-100 sm:text-base">
                  {value}
                  {unit}
                </dd>
              </div>
            );
          })}
        </dl>
      ) : null}
      {footnotes?.length ? (
        <div className="mt-4">
          <h5 className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">Context</h5>
          <div className="mt-2">{renderList(footnotes, "bg-slate-400")}</div>
        </div>
      ) : null}
    </div>
  );
}

type SectionCardProps = {
  section: CalculatorSummarySection;
  showDetails: boolean;
};

const PREVIEW_CHAR_LIMIT = 210;
const PREVIEW_METRIC_LIMIT = 2;

function SectionCard({ section, showDetails }: SectionCardProps) {
  const { headline, summary, details, metrics, bullets, assumptions, risks } = section;

  const showAssumptions = showDetails && assumptions?.length;
  const showRisks = showDetails && risks?.length;
  const showBullets = showDetails && bullets?.length;
  const showDetailsText = showDetails && details;

  const normalizedSummary = (summary ?? "").trim();
  const needsPreviewClamp = !showDetails && normalizedSummary.length > PREVIEW_CHAR_LIMIT;
  const previewSummary = needsPreviewClamp ? `${normalizedSummary.slice(0, PREVIEW_CHAR_LIMIT).trimEnd()}…` : normalizedSummary;

  const compactMetrics = metrics?.slice(0, showDetails ? metrics.length : PREVIEW_METRIC_LIMIT) ?? [];

  return (
    <div className="rounded-xl border border-ocean/40 bg-slate-950/35 p-3 shadow-inner shadow-[0_0_18px_rgba(7,24,36,0.18)] sm:rounded-2xl sm:p-4">
      <div className="flex items-center justify-between gap-3">
        {headline ? <h4 className="text-sm font-semibold text-slate-100 sm:text-base">{headline}</h4> : null}
        {section.type ? (
          <span className="rounded-full border border-ocean/25 bg-slate-950/50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {section.type.replace(/[_-]/g, " ")}
          </span>
        ) : null}
      </div>
      {previewSummary ? (
        <div className="mt-2 text-xs text-muted sm:text-sm">
          <MessageParser content={previewSummary} />
        </div>
      ) : null}
      {compactMetrics.length ? (
        <dl className="mt-3 grid gap-2 rounded-xl border border-ocean/35 bg-slate-950/45 p-3 sm:grid-cols-2 sm:p-4">
          {compactMetrics.map((metric, index) => {
            const value = formatValue(metric.value);
            const unit = metric.unit ? ` ${metric.unit}` : "";
            return (
              <div key={`${metric.label}-${index}`}>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
                  {metric.label}
                </dt>
                <dd className="text-sm font-semibold text-slate-100 sm:text-base">
                  {value}
                  {unit}
                </dd>
              </div>
            );
          })}
        </dl>
      ) : null}
      {showDetailsText ? (
        <div className="mt-3 text-xs text-muted sm:text-sm">
          <MessageParser content={details as string} />
        </div>
      ) : null}
      {showBullets ? <div className="mt-3">{renderList(bullets, "bg-mint")}</div> : null}
      {showAssumptions ? (
        <div className="mt-3">
          <h5 className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">Assumptions</h5>
          <div className="mt-2">{renderList(assumptions, "bg-slate-400")}</div>
        </div>
      ) : null}
      {showRisks ? (
        <div className="mt-3">
          <h5 className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">Risks</h5>
          <div className="mt-2">{renderList(risks, "bg-critical")}</div>
        </div>
      ) : null}
    </div>
  );
}

type InsightContextProps = {
  insight: CalculatorInsight;
  showDetails: boolean;
};

function InsightContext({ insight, showDetails }: InsightContextProps) {
  const context = insight.context;

  if (!context) {
    return null;
  }

  const contextChips = [
    context.asset ? `Asset: ${context.asset}` : null,
    context.as_of ? `As of: ${context.as_of}` : null,
  ].filter(Boolean) as string[];

  const inputs = context.inputs && typeof context.inputs === "object" && !Array.isArray(context.inputs)
    ? Object.entries(context.inputs as Record<string, unknown>)
    : [];

  const assumptions = Array.isArray(context.assumptions)
    ? (context.assumptions.filter((item): item is string => typeof item === "string" && item.trim().length > 0) as string[])
    : [];

  if (!contextChips.length && !inputs.length && !assumptions.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      {contextChips.length ? (
        <div className="flex flex-wrap gap-2">
          {contextChips.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center rounded-full border border-ocean/35 bg-slate-950/60 px-3 py-1 text-[11px] font-medium text-slate-200 shadow-sm sm:text-xs"
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}
      {showDetails && inputs.length ? (
        <div className="rounded-xl border border-ocean/40 bg-slate-950/45 p-3 sm:p-4">
          <h5 className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">Inputs</h5>
          <dl className="mt-2 grid gap-2 text-xs text-slate-200 sm:grid-cols-2 sm:text-sm">
            {inputs.map(([key, value]) => (
              <div key={key}>
                <dt className="font-semibold text-slate-300">{key.replace(/_/g, " ")}</dt>
                <dd className="text-slate-200">{formatValue(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
      {showDetails && assumptions.length ? (
        <div>
          <h5 className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">Context assumptions</h5>
          <div className="mt-2">{renderList(assumptions, "bg-slate-400")}</div>
        </div>
      ) : null}
    </div>
  );
}

function FallbackCard({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-ocean/40 bg-slate-950/35 p-3 shadow-inner shadow-[0_0_18px_rgba(7,24,36,0.18)] sm:rounded-2xl sm:p-4">
      <div className="flex items-start gap-3">
        <span className="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-mint shadow-[0_0_10px_rgba(58,198,255,0.65)]" aria-hidden />
        <MessageParser content={text} className="flex-1 text-xs text-muted sm:text-sm" />
      </div>
    </div>
  );
}

export function SummaryPanel({
  title = "Nova’s takeaway",
  deterministicSummary,
  aiStatus = "idle",
  insight = null,
  fallbackLines = [],
  fallbackMessage,
  emptyMessage = "No summary available for this run.",
  isLoading = false,
  loadingMessage = "Awaiting Nova’s projection...",
}: SummaryPanelProps) {
  const [showDetails, setShowDetails] = useState(false);

  const hasInsight = Boolean(insight && insight.sections?.length);
  const resolvedMessage = (fallbackMessage ?? "").trim();

  const PREVIEW_SECTION_LIMIT = 2;
  const allSections = hasInsight ? insight?.sections ?? [] : [];
  const primarySections = hasInsight ? allSections.slice(0, PREVIEW_SECTION_LIMIT) : [];
  const extraSections = hasInsight ? allSections.slice(PREVIEW_SECTION_LIMIT) : [];

  const PREVIEW_FALLBACK_LIMIT = 2;
  const primaryFallbackLines = !hasInsight ? fallbackLines.slice(0, showDetails ? fallbackLines.length : PREVIEW_FALLBACK_LIMIT) : [];
  const extraFallbackLines = !hasInsight ? fallbackLines.slice(primaryFallbackLines.length) : [];

  const contextInputs = insight?.context?.inputs;
  const hasContextInputs =
    Boolean(
      contextInputs &&
        typeof contextInputs === "object" &&
        !Array.isArray(contextInputs) &&
        Object.keys(contextInputs as Record<string, unknown>).length > 0,
    );

  const contextAssumptions = insight?.context?.assumptions;
  const hasContextAssumptions = Boolean(
    Array.isArray(contextAssumptions) &&
      contextAssumptions.some((item) => typeof item === "string" && item.trim().length > 0),
  );

  const primaryHasHiddenDetail = primarySections.some(
    (section) =>
      Boolean(section.details) ||
      (section.assumptions?.length ?? 0) > 0 ||
      (section.risks?.length ?? 0) > 0 ||
      (section.bullets?.length ?? 0) > 0,
  );

  const showToggle =
    hasInsight
      ? Boolean(
          extraSections.length ||
            (insight?.notes?.length ?? 0) ||
            hasContextInputs ||
            hasContextAssumptions ||
            primaryHasHiddenDetail,
        )
      : extraFallbackLines.length > 0;

  const insightContent = isLoading ? (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <CalculatorSpinner />
      <LoadingDots
        text="Nova is modeling"
        className="text-xs font-semibold uppercase tracking-widest text-mint/80 sm:text-sm"
      />
      <p className="max-w-xs text-xs text-slate-300 sm:text-sm">{loadingMessage}</p>
    </div>
  ) : (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      {hasInsight ? (
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          <InsightContext insight={insight as CalculatorInsight} showDetails={showDetails} />
          {(showDetails ? allSections : primarySections).map((section, index) => (
            <SectionCard key={`${section.type}-${index}`} section={section} showDetails={showDetails} />
          ))}
          {showDetails && insight?.notes?.length ? (
            <div className="rounded-xl border border-mint/35 bg-slate-950/45 p-3 sm:p-4">
              <h5 className="text-[11px] font-medium uppercase tracking-wide text-mint sm:text-xs">Notes</h5>
              <div className="mt-2">{renderList(insight.notes, "bg-mint")}</div>
            </div>
          ) : null}
        </div>
      ) : primaryFallbackLines.length ? (
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {primaryFallbackLines.map((line, index) => (
            <FallbackCard key={`${line}-${index}`} text={line} />
          ))}
          {showDetails &&
            extraFallbackLines.map((line, index) => (
              <FallbackCard key={`${line}-extra-${index}`} text={line} />
            ))}
        </div>
      ) : (
        <p className="text-xs text-muted sm:text-sm">{resolvedMessage || emptyMessage}</p>
      )}
      {showToggle ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowDetails((previous) => !previous)}
            className="inline-flex items-center gap-2 rounded-full border border-mint/35 bg-slate-950/50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-mint transition hover:border-mint hover:bg-slate-900/60 sm:text-xs"
          >
            {showDetails ? "Hide details" : "View full insight"}
          </button>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="card-surface-muted flex h-full flex-col gap-4 rounded-2xl bg-gradient-to-br from-slate-950/65 via-slate-950/45 to-slate-900/24 p-4 shadow-[0_10px_32px_rgba(6,21,34,0.32)] sm:gap-5 sm:rounded-3xl sm:p-6 min-w-0 overflow-hidden">
      <div className="flex h-full flex-col min-w-0 overflow-hidden">
        <h3 className="text-lg font-semibold text-slate-50 sm:text-xl">{title}</h3>
        <div className="mt-3 flex flex-1 min-w-0 sm:mt-4">
          <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-2xl border border-ocean/65 bg-surface/80 p-4 shadow-inner shadow-[0_0_28px_rgba(7,24,36,0.22)] sm:p-5">
            {deterministicSummary ? (
              <DeterministicSummaryCard summary={deterministicSummary} aiStatus={aiStatus} />
            ) : null}
            <div className="flex-1 rounded-xl border border-ocean/30 bg-slate-950/45 p-3 sm:p-4">
              {insightContent}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
