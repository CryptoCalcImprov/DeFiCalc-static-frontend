import { HeroSection } from "@/components/sections/hero";
import { InsightsSection } from "@/components/sections/insights";
import { MarketPulseSection } from "@/components/sections/market-pulse";
import { ProtocolLeadersSection } from "@/components/sections/protocol-leaders";
import { ToolkitHighlightsSection } from "@/components/sections/toolkit-highlights";
import { Section } from "@/components/layout/section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { NovaAssistant } from "@/components/ui/nova-assistant";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <Section
          id="markets"
          title="Market pulse that surfaces what matters"
          description="Monitor macro DeFi health, stablecoin flows, and the pairs gaining momentum across networks."
        >
          <MarketPulseSection />
        </Section>
        <Section
          id="protocols"
          title="Protocol leaders and governance radar"
          description="Rank strategies by TVL, growth, and on-chain governance signals so you never miss a pivotal update."
        >
          <ProtocolLeadersSection />
        </Section>
        <Section
          id="toolkit"
          title="Analyst toolkit built for collaboration"
          description="Everything your team needs to design, test, and share strategies – from risk dashboards to the Calculator Sandbox."
        >
          <ToolkitHighlightsSection />
        </Section>
        <Section
          id="insights"
          title="Insights library that educates while you explore"
          description="Guided explainers and playbooks keep new users confident and give veterans deeper context for every move."
        >
          <InsightsSection />
        </Section>
      </main>
      <SiteFooter />
      <NovaAssistant />
    </div>
  );
}
