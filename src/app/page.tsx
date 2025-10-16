import { CallToActionSection } from "@/components/sections/cta";
import { FeaturesSection } from "@/components/sections/features";
import { HeroSection } from "@/components/sections/hero";
import { MarketsOverview } from "@/components/sections/markets-overview";
import { ProtocolLeadersSection } from "@/components/sections/protocol-leaders";
import { WorkflowSection } from "@/components/sections/workflow";
import { NovaAssistant } from "@/components/sections/nova-assistant";
import { Section } from "@/components/layout/section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="relative flex-1">
        <HeroSection />
        <Section
          id="markets"
          title="Markets at a glance"
          description="Anchor newcomers with context while giving power users fast scanning tools. These cards will connect to live data refresh once the analytics pipeline is ready."
        >
          <MarketsOverview />
        </Section>
        <ProtocolLeadersSection />
        <Section
          id="toolkit"
          title="Analyst toolkit & feature highlights"
          description="Modular cards preview how DeFiCalc evolves beyond tables: risk scoring, cross-chain coverage, team workspaces and the calculator sandbox teaser."
        >
          <FeaturesSection />
        </Section>
        <Section
          id="insights"
          title="Design deliverables & next steps"
          description="Roadmap the design process so stakeholders understand what ships when and how handoff will work with engineering."
          className="bg-abyss/60"
        >
          <WorkflowSection />
        </Section>
        <section id="cta" className="border-b border-slate-800/60 bg-gradient-to-b from-midnight via-abyss to-deep py-20">
          <div className="mx-auto max-w-6xl px-6">
            <CallToActionSection />
          </div>
        </section>
      </main>
      <SiteFooter />
      <NovaAssistant />
    </div>
  );
}
