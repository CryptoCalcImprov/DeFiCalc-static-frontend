import { HeroSection } from "@/components/sections/hero";
import { MarketPulseSection } from "@/components/sections/market-pulse";
import { ProtocolLeadersSection } from "@/components/sections/protocol-leaders";
import { AnalystToolkitSection } from "@/components/sections/analyst-toolkit";
import { InsightsHubSection } from "@/components/sections/insights-hub";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { NovaAssistant } from "@/components/layout/nova-assistant";
import { LaunchAppFab } from "@/components/layout/launch-app-fab";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-deep text-slate-100">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <MarketPulseSection />
        <ProtocolLeadersSection />
        <AnalystToolkitSection />
        <InsightsHubSection />
      </main>
      <SiteFooter />
      <NovaAssistant />
      <LaunchAppFab />
    </div>
  );
}
