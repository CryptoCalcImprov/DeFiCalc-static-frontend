import Image from "next/image";

import { insightsLibrary } from "@/lib/site-content";
import { publicAsset } from "@/lib/public-asset";

const mockConversation = [
  {
    role: "user" as const,
    content: "Nova, can you turn this LSD yield explainer into a quick brief for today's onboarding session?"
  },
  {
    role: "assistant" as const,
    content:
      "Absolutely. Here's how I'd teach it:\n• stETH pays consensus rewards; Pendle splits it into principal + yield.\n• Lock the PT side to secure a fixed rate, then rotate the YT for boosted upside.\n• Monitor validator queue time and ETH/BTC beta before sizing exposure."
  },
  {
    role: "user" as const,
    content: "Great—log it to the Education workspace and flag any governance risks I should mention."
  },
  {
    role: "assistant" as const,
    content:
      "Done. I tagged the workbook and noted that Lido's next Snapshot vote could adjust reward share. I'll ping you if that proposal shifts."
  }
] as const;

export function InsightsSection() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <div className="flex flex-col gap-6">
        <div className="rounded-3xl border border-slate-800/70 bg-gradient-to-br from-slate-950/85 via-slate-950/65 to-slate-900/35 p-6 shadow-[0_18px_48px_rgba(5,17,28,0.36)] sm:p-7">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint/15 ring-1 ring-mint/30 overflow-hidden">
              <Image
                src={publicAsset("/assets/nova-avatar.png")}
                alt="Nova AI"
                width={48}
                height={48}
                className="h-full w-full object-cover scale-[1.32]"
              />
            </div>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-mint/35 bg-mint/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-mint/90">
                Education enhanced with Nova
              </span>
              <h3 className="mt-3 text-xl font-semibold leading-snug text-slate-50">
                Nova AI keeps your desk sharp with explainers, risk drills, and walkthroughs tuned to what you&apos;re
                building.
              </h3>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            Every lesson pulls from the same live telemetry powering Nova&apos;s trading briefings. You get clean
            definitions, scenario calculators, and governance context without leaving the workspace.
          </p>
          <dl className="mt-5 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/80 px-4 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Guided explainers</dt>
              <dd className="mt-2 text-sm text-slate-200">
                Nova steps through core concepts with annotated charts and calculator-ready formulas.
              </dd>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/80 px-4 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Actionable context</dt>
              <dd className="mt-2 text-sm text-slate-200">
                Each module ties back to live governance, risk signals, and playbooks you can test instantly.
              </dd>
            </div>
          </dl>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {insightsLibrary.map((insight) => (
            <article
              key={insight.title}
              className="flex h-full flex-col rounded-3xl border border-slate-800/70 bg-slate-950/85 p-6 shadow-[0_14px_36px_rgba(5,17,28,0.28)] transition hover:border-mint/35 hover:shadow-[0_20px_40px_rgba(18,193,196,0.22)]"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">{insight.title}</h3>
                <span className="inline-flex items-center rounded-full bg-mint/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-mint/80">
                  Nova
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{insight.description}</p>
              <button
                type="button"
                className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-mint transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                {insight.action}
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 3l6 5-6 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </article>
          ))}
        </div>
      </div>
      <div className="flex flex-col rounded-3xl border border-slate-800/70 bg-gradient-to-br from-slate-950/85 via-slate-950/60 to-slate-900/30 p-6 shadow-[0_18px_48px_rgba(5,17,28,0.36)]">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-lavender/35 bg-lavender/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-lavender/90">
            Nova assistant preview
          </span>
          <span className="text-[11px] text-slate-400">Mock conversation</span>
        </div>
        <div className="mt-5 flex-1 rounded-2xl border border-slate-800/70 bg-slate-950/75 p-4 shadow-inner shadow-[0_0_24px_rgba(7,24,36,0.24)]">
          <div className="flex h-full flex-col gap-4">
            {mockConversation.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={message.role === "assistant" ? "flex items-start gap-3 text-left" : "flex justify-end"}
              >
                {message.role === "assistant" ? (
                  <>
                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-mint/20 overflow-hidden">
                      <Image
                        src={publicAsset("/assets/nova-avatar.png")}
                        alt="Nova assistant"
                        width={24}
                        height={24}
                        className="h-full w-full object-cover scale-[1.32]"
                      />
                    </div>
                    <div className="max-w-[78%] rounded-2xl bg-slate-900/80 px-4 py-3 text-sm leading-relaxed text-slate-200 shadow-[0_6px_20px_rgba(8,24,38,0.28)]">
                      {message.content.split("\n").map((line, lineIndex) =>
                        line.trim().length === 0 ? null : line.startsWith("•") ? (
                          <p key={lineIndex} className="pl-4 text-sm leading-relaxed text-slate-200">
                            <span className="mr-2 text-mint/80">•</span>
                            {line.replace(/^•\s*/, "")}
                          </p>
                        ) : (
                          <p key={lineIndex} className={lineIndex > 0 ? "mt-2" : ""}>
                            {line}
                          </p>
                        ),
                      )}
                    </div>
                  </>
                ) : (
                  <div className="max-w-[72%] rounded-2xl bg-mint/15 px-4 py-3 text-right text-sm leading-relaxed text-mint shadow-[0_6px_20px_rgba(11,196,191,0.25)]">
                    {message.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-300">
          Nova AI combines DeFi-native language models, governance feeds, and your calculator workspace to deliver
          training that actually sticks—so every teammate stays fluent in the strategies you deploy.
        </p>
      </div>
    </div>
  );
}
