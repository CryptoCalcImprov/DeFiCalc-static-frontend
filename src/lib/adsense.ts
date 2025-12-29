export const ADSENSE_CLIENT_ID =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-3232932863925299";

export const ADSENSE_SLOTS = {
  // TODO: Replace with real AdSense ad unit IDs from the AdSense dashboard.
  // Each slot should be a unique ad unit ID (e.g., "1234567890").

  // ===== APP PAGE (Calculator Workspace) =====
  // Below intro, above calculators
  workspaceHeader: "",
  // Summary panel states
  novaSummaryLoading: "",
  novaSummaryFallback: "",
  // Between panels and chart (thin horizontal)
  betweenPanelsAndChart: "",
  // Below the price trajectory chart
  belowChart: "",

  // ===== LANDING PAGE =====
  // After hero section
  landingAfterHero: "",
  // Between workspace and markets sections
  landingAfterWorkspace: "",
  // Between markets and insights sections
  landingAfterMarkets: "",
  // Between insights and about sections
  landingAfterInsights: "",
} as const;
