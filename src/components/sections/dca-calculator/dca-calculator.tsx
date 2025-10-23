"use client";

import { FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

type DcaCadence = "weekly" | "biweekly" | "monthly";

type FormState = {
  asset: string;
  initialInvestment: string;
  recurringAmount: string;
  cadence: DcaCadence;
  durationMonths: string;
  targetApy: string;
  referencePrice: string;
};

type NovaStatus =
  | { status: "idle" }
  | { status: "pending"; requestId: string }
  | { status: "success"; requestId: string; message: string }
  | { status: "error"; requestId?: string; message: string };

type DerivedMetrics = {
  totalInvested: number;
  totalRecurring: number;
  projectedValue: number;
  monthlyContribution: number;
  estimatedTokens: number;
};

const fallbackMessage =
  "Nova isn't connected in this preview. Open the Ask Nova assistant inside the product to generate a tailored breakdown.";

const cadenceLabels: Record<DcaCadence, string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
};

const cadenceMultiplier: Record<DcaCadence, number> = {
  weekly: 4,
  biweekly: 2,
  monthly: 1,
};

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const tokenFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 4,
});

function createNovaPrompt(form: FormState, metrics: DerivedMetrics) {
  const apy = Number.parseFloat(form.targetApy) || 0;
  return `You are Nova, a DeFi research assistant. Generate a concise breakdown of this dollar cost averaging plan.
Asset: ${form.asset}
Initial investment: $${Number.parseFloat(form.initialInvestment) || 0}
Recurring contribution: $${Number.parseFloat(form.recurringAmount) || 0} ${cadenceLabels[form.cadence].toLowerCase()}
Duration: ${Number.parseInt(form.durationMonths, 10) || 0} months
Reference price: $${Number.parseFloat(form.referencePrice) || 0}
Target APY assumption: ${apy}%
Total contributed: $${metrics.totalInvested.toFixed(2)}
Projected value (with APY assumption): $${metrics.projectedValue.toFixed(2)}
Estimated tokens accumulated: ${metrics.estimatedTokens.toFixed(4)}

Return a short paragraph plus three bullet points that summarize risk considerations, break-even insights, and what to monitor.`;
}

export function DcaCalculatorSection() {
  const [form, setForm] = useState<FormState>({
    asset: "ETH",
    initialInvestment: "1500",
    recurringAmount: "250",
    cadence: "monthly",
    durationMonths: "6",
    targetApy: "8",
    referencePrice: "3200",
  });
  const [novaStatus, setNovaStatus] = useState<NovaStatus>({ status: "idle" });

  const metrics = useMemo<DerivedMetrics>(() => {
    const initial = Number.parseFloat(form.initialInvestment) || 0;
    const recurring = Number.parseFloat(form.recurringAmount) || 0;
    const months = Math.max(Number.parseInt(form.durationMonths, 10) || 0, 0);
    const apy = Math.max(Number.parseFloat(form.targetApy) || 0, 0);
    const price = Math.max(Number.parseFloat(form.referencePrice) || 0, 0);

    const cadenceFactor = cadenceMultiplier[form.cadence];
    const totalRecurring = recurring * cadenceFactor * months;
    const totalInvested = initial + totalRecurring;
    const monthlyContribution = recurring * cadenceFactor;
    const monthlyRate = apy > 0 ? apy / 100 / 12 : 0;

    let projectedValue = totalInvested;
    if (monthlyRate > 0) {
      const growthFactor = Math.pow(1 + monthlyRate, months);
      const initialFuture = initial * growthFactor;
      const contributionFuture =
        monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
      projectedValue = initialFuture + contributionFuture;
    }

    const estimatedTokens = price > 0 ? totalInvested / price : 0;

    return {
      totalInvested,
      totalRecurring,
      projectedValue,
      monthlyContribution,
      estimatedTokens,
    };
  }, [form]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const requestId = `dca-${Date.now()}`;
    setNovaStatus({ status: "pending", requestId });
    const apiUrl = process.env.NEXT_PUBLIC_NOVA_API_URL?.replace(/\/$/, "");
    const apiKey = process.env.NEXT_PUBLIC_NOVA_API_KEY;

    if (!apiUrl || !apiKey) {
      setNovaStatus({
        status: "error",
        requestId,
        message: "Nova configuration is missing. Please set NEXT_PUBLIC_NOVA_API_URL and NEXT_PUBLIC_NOVA_API_KEY.",
      });
      return;
    }

    const prompt = createNovaPrompt(form, metrics);

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
            form,
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
      let message = fallbackMessage;

      if (rawPayload) {
        try {
          const data = JSON.parse(rawPayload);
          message =
            (typeof data === "string" && data) ||
            data?.output ||
            data?.message ||
            data?.data?.output ||
            fallbackMessage;
        } catch (parseError) {
          message = rawPayload;
        }
      }

      setNovaStatus({ status: "success", requestId, message });
    } catch (error) {
      setNovaStatus({
        status: "error",
        requestId,
        message:
          error instanceof Error
            ? error.message || fallbackMessage
            : fallbackMessage,
      });
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-lg shadow-black/10">
        <header className="mb-6">
          <div className="inline-flex items-center rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-mint">
            Nova powered
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-white">Set up a DCA plan</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Tune contribution amounts and assumptions, then let Nova outline the trade-offs for your strategy.
          </p>
        </header>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Asset symbol</span>
              <input
                type="text"
                value={form.asset}
                onChange={(event) => setForm((prev) => ({ ...prev, asset: event.target.value }))}
                className="w-full rounded-xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-mint"
                placeholder="e.g. ETH"
                required
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Reference price (USD)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.referencePrice}
                onChange={(event) => setForm((prev) => ({ ...prev, referencePrice: event.target.value }))}
                className="w-full rounded-xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-mint"
                placeholder="3200"
              />
            </label>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Initial investment (USD)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.initialInvestment}
                onChange={(event) => setForm((prev) => ({ ...prev, initialInvestment: event.target.value }))}
                className="w-full rounded-xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-mint"
                placeholder="1500"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Recurring amount (USD)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.recurringAmount}
                onChange={(event) => setForm((prev) => ({ ...prev, recurringAmount: event.target.value }))}
                className="w-full rounded-xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-mint"
                placeholder="250"
              />
            </label>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Cadence</span>
              <select
                value={form.cadence}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, cadence: event.target.value as DcaCadence }))
                }
                className="w-full appearance-none rounded-xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-mint"
              >
                {Object.entries(cadenceLabels).map(([value, label]) => (
                  <option key={value} value={value} className="bg-slate-900">
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Duration (months)</span>
              <input
                type="number"
                min="1"
                step="1"
                value={form.durationMonths}
                onChange={(event) => setForm((prev) => ({ ...prev, durationMonths: event.target.value }))}
                className="w-full rounded-xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-mint"
                placeholder="6"
              />
            </label>
          </div>
          <label className="space-y-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Target APY assumption</span>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.targetApy}
                onChange={(event) => setForm((prev) => ({ ...prev, targetApy: event.target.value }))}
                className="w-full rounded-xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-mint"
                placeholder="8"
              />
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">%</span>
            </div>
          </label>
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 text-xs text-slate-400">
            <p className="font-semibold text-slate-200">Nova prompt preview</p>
            <p>
              {form.asset} • ${form.initialInvestment || 0} initial, ${form.recurringAmount || 0} {cadenceLabels[form.cadence].toLowerCase()}
              , {form.durationMonths || 0} months, {form.targetApy || 0}% APY assumption.
            </p>
          </div>
          <Button type="submit" variant="gradient" className="w-full justify-center py-3 text-sm font-semibold">
            Ask Nova for the breakdown
          </Button>
        </form>
      </section>
      <section className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-lg shadow-black/10">
        <header className="mb-6">
          <h3 className="text-2xl font-semibold text-white">Plan snapshot</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            We estimate how much capital you deploy, potential upside with your APY assumption, and the token stack you could
            accumulate if prices hold.
          </p>
        </header>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Total invested</p>
            <p className="mt-2 text-xl font-semibold text-white">{usdFormatter.format(metrics.totalInvested)}</p>
            <p className="mt-1 text-xs text-slate-400">
              Includes {usdFormatter.format(metrics.totalRecurring)} in recurring buys (~
              {usdFormatter.format(metrics.monthlyContribution)} monthly).
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Projected value</p>
            <p className="mt-2 text-xl font-semibold text-white">{usdFormatter.format(metrics.projectedValue)}</p>
            <p className="mt-1 text-xs text-slate-400">Based on a {form.targetApy || 0}% APY assumption.</p>
          </div>
          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Estimated tokens</p>
            <p className="mt-2 text-xl font-semibold text-white">{tokenFormatter.format(metrics.estimatedTokens)}</p>
            <p className="mt-1 text-xs text-slate-400">At a reference price of ${form.referencePrice || 0}.</p>
          </div>
        </div>
        <div className="mt-6 space-y-4 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mint/20 text-sm font-semibold uppercase text-mint">
              N
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Nova insights</p>
              <p className="text-xs text-slate-400">Responses surface risk, timing notes, and what to monitor.</p>
            </div>
          </div>
          {novaStatus.status === "idle" ? (
            <p className="text-sm text-slate-300">
              Configure a plan and ask Nova to synthesize considerations before you execute.
            </p>
          ) : null}
          {novaStatus.status === "pending" ? (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 text-sm text-slate-300">
              <svg className="h-5 w-5 animate-spin text-mint" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span>Waiting on Nova to craft your breakdown...</span>
            </div>
          ) : null}
          {novaStatus.status === "success" ? (
            <article className="space-y-3 rounded-2xl border border-mint/40 bg-mint/10 p-4 text-sm text-mint-100">
              {novaStatus.message.split(/\n+/).map((paragraph, index) => (
                <p key={index} className="text-slate-100">
                  {paragraph}
                </p>
              ))}
            </article>
          ) : null}
          {novaStatus.status === "error" ? (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
              {novaStatus.message}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
