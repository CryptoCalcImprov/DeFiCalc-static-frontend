export const ADSENSE_CLIENT_ID =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-3232932863925299";

export const ADSENSE_SLOTS = {
  // ===== APP PAGE (Calculator Workspace) =====
  workspaceHeader: "7581490352",
  novaSummaryLoading: "4168665439",
  novaSummaryFallback: "1542502090",
  betweenPanelsAndChart: "6089101825",
  belowChart: "4776020157",

  // ===== LANDING PAGE =====
  landingAfterHero: "6076836990",
  landingAfterWorkspace: "2273323353",
  landingAfterMarkets: "3658379608",
  landingAfterInsights: "2580445115",
} as const;
