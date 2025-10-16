const marketMetrics = [
  {
    label: "Total DeFi TVL",
    value: "$74.2B",
    change: "+3.8%",
    sentiment: "up",
    description: "Aggregated across 12 supported networks with daily reconciliation.",
    spark: [5, 8, 6, 9, 11, 10, 13]
  },
  {
    label: "24h Protocol Volume",
    value: "$9.7B",
    change: "+1.4%",
    sentiment: "up",
    description: "Blended swap, lending and options volume with slippage adjustments.",
    spark: [7, 6, 8, 9, 7, 11, 12]
  },
  {
    label: "Avg Lending APY",
    value: "6.2%",
    change: "-0.3%",
    sentiment: "down",
    description: "Top-tier stablecoin markets weighted by on-chain utilization.",
    spark: [9, 8, 8, 7, 6, 7, 6]
  }
] as const;

const marketNotes = [
  "Sponsored strategies rotate here — clearly labeled and styled to match the interface.",
  "Pin Nova questions to metrics so analysts can open the chat with context.",
  "Add calculator inputs on hover to drop strategies into the upcoming sandbox."
] as const;

export function MarketPulseSection() {
  return (
    <section id="markets" className="border-b border-slate-900 bg-brand-midnight/80 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <header className="mb-12 max-w-2xl space-y-4">
          <span className="rounded-full border border-brand-teal/30 bg-brand-teal/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-teal">
            Market pulse
          </span>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">Understand the market at a glance.</h2>
          <p className="text-base text-slate-300">
            Monitor DeFi health across chains with modular cards that expand into deep dives. Each widget doubles as a data source for Nova — opening the door for conversational explanations and alerts.
          </p>
        </header>
        <div className="grid gap-6 lg:grid-cols-3">
          {marketMetrics.map((metric) => (
            <article
              key={metric.label}
              className="relative overflow-hidden rounded-3xl border border-slate-900/60 bg-card-glass p-6 shadow-card"
            >
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/15 via-transparent to-transparent" />
              <div className="relative flex items-center justify-between text-xs uppercase tracking-[0.28em] text-slate-500">
                <span>{metric.label}</span>
                <span className={metric.sentiment === "up" ? "text-brand-teal" : "text-danger"}>{metric.change}</span>
              </div>
              <p className="relative mt-6 text-4xl font-semibold text-white">{metric.value}</p>
              <p className="relative mt-2 text-sm text-slate-400">{metric.description}</p>
              <Sparkline values={metric.spark} sentiment={metric.sentiment} id={metric.label} />
              <button className="relative mt-4 inline-flex items-center gap-2 rounded-full border border-slate-800/80 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:border-primary hover:text-white">
                Summon Nova insight
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m7 17 9-9m0 0h-6m6 0v6" />
                </svg>
              </button>
            </article>
          ))}
        </div>
        <div className="mt-12 grid gap-4 rounded-3xl border border-slate-900/60 bg-brand-navy/40 p-6 text-sm text-slate-300 md:grid-cols-3">
          {marketNotes.map((note) => (
            <p key={note} className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-navy/80 text-brand-aqua">•</span>
              {note}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

interface SparklineProps {
  values: readonly number[];
  sentiment: "up" | "down";
  id: string;
}

function Sparkline({ values, sentiment, id }: SparklineProps) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 100 - ((value - min) / (max - min || 1)) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  const gradientId = `spark-${id.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`;

  return (
    <svg className="relative mt-6 h-24 w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        fill={`url(#${gradientId})`}
        stroke="none"
        points={`${points} 100,100 0,100`}
        opacity={0.2}
      />
      <polyline
        fill="none"
        stroke={sentiment === "up" ? "#14B8A6" : "#F87171"}
        strokeWidth={2.5}
        strokeLinecap="round"
        points={points}
      />
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sentiment === "up" ? "#14B8A6" : "#F87171"} stopOpacity={0.25} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
    </svg>
  );
}
