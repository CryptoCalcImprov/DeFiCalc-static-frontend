export const ADSENSE_CLIENT_ID =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-3232932863925299";

export const ADSENSE_SLOTS = {
  // TODO: Replace with real AdSense ad unit IDs.
  novaSummaryLoading: "",
  novaSummaryFallback: "",
} as const;
