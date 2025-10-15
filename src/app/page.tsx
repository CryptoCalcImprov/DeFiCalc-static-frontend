import { HeroSection } from "@/components/sections/hero";
import { MarketOverviewSection } from "@/components/sections/market-overview";
import { MarketTrendsSection } from "@/components/sections/market-trends";
import { DefiProtocolsSection } from "@/components/sections/defi-protocols";
import { ToolkitSection } from "@/components/sections/toolkit";
import { InsightsSection } from "@/components/sections/insights";
import { Section } from "@/components/layout/section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <Section
          id="overview"
          eyebrow="Market Pulse"
          title="Stay ahead of every DeFi market swing"
          description="One dashboard for your macro health metrics—market cap, volume, stablecoin supply, and total value locked across leading protocols."
        >
          <MarketOverviewSection />
        </Section>
        <Section
          id="markets"
          eyebrow="Token & DEX Activity"
          title="Spot momentum before the herd"
          description="Identify surging assets, track multi-chain liquidity, and surface the pools generating the most fees."
          className="bg-slate-950"
        >
          <MarketTrendsSection />
        </Section>
        <Section
          id="protocols"
          eyebrow="Protocol Leaders"
          title="Surface the strongest DeFi primitives"
          description="Filter by category, growth, and governance signals to pinpoint the protocols worth your attention."
        >
          <DefiProtocolsSection />
        </Section>
        <Section
          id="toolkit"
          eyebrow="Analyst Toolkit"
          title="Everything you need to plan your next move"
          description="From scenario planning to automation, DeFiCalc equips your team to execute faster with less risk."
          className="bg-slate-950"
        >
          <ToolkitSection />
        </Section>
        <Section
          id="insights"
          eyebrow="Latest Insights"
          title="Research that turns data into decisions"
          description="Digestible analysis and weekly briefings help you navigate the next cycle with confidence."
        >
          <InsightsSection />
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
