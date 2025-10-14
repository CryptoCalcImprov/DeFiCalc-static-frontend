import { CallToActionSection } from "@/components/sections/cta";
import { FeaturesSection } from "@/components/sections/features";
import { HeroSection } from "@/components/sections/hero";
import { WorkflowSection } from "@/components/sections/workflow";
import { Section } from "@/components/layout/section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <Section
          id="features"
          title="Build with reusable sections"
          description="Compose your landing page from modular building blocks that scale with your product."
        >
          <FeaturesSection />
        </Section>
        <Section
          id="workflow"
          title="Workflow that keeps deployments simple"
          description="Each step focuses on developer experience for GitHub Pages hosting."
        >
          <WorkflowSection />
        </Section>
        <Section
          id="cta"
          title="Start shipping in minutes"
          description="Use the preconfigured commands and documentation to push live quickly."
          className="bg-slate-950"
        >
          <CallToActionSection />
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
