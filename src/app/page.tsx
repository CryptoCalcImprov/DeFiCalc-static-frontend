import { HeroSection } from "@/components/sections/hero";
import { MarketPulseSection } from "@/components/sections/market-pulse";
import { ProtocolLeadersSection } from "@/components/sections/protocol-leaders";
import { ToolkitHighlightsSection } from "@/components/sections/toolkit-highlights";
import { NovaPreviewSection } from "@/components/sections/nova-preview";
import { DeliverablesSection } from "@/components/sections/deliverables";
import { LaunchCTASection } from "@/components/sections/launch-cta";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { NovaAssistantLauncher } from "@/components/layout/nova-launcher";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <MarketPulseSection />
        <ProtocolLeadersSection />
        <ToolkitHighlightsSection />
        <NovaPreviewSection />
        <DeliverablesSection />
        <LaunchCTASection />
      </main>
      <SiteFooter />
      <NovaAssistantLauncher />
    </div>
  );
}
