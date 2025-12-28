"use client";

import { useEffect } from "react";

import { ADSENSE_CLIENT_ID } from "@/lib/adsense";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdSlotProps = {
  adSlot: string;
  className?: string;
  format?: "auto" | "rectangle" | "vertical" | "horizontal";
  fullWidthResponsive?: boolean;
  minHeight?: number;
};

export function AdSlot({
  adSlot,
  className,
  format = "auto",
  fullWidthResponsive = true,
  minHeight = 120,
}: AdSlotProps) {
  useEffect(() => {
    if (!adSlot || typeof window === "undefined") {
      return;
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[AdSlot] Failed to initialize AdSense slot", error);
      }
    }
  }, [adSlot]);

  if (!adSlot) {
    return null;
  }

  return (
    <div className={["w-full", className].filter(Boolean).join(" ")}>
      <ins
        className="adsbygoogle block w-full"
        style={{ minHeight }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
}
