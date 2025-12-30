"use client";

import { useEffect, useRef } from "react";

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
  label?: string;
};

function AdPlaceholder({
  minHeight,
  format,
  label,
}: {
  minHeight: number;
  format: string;
  label?: string;
}) {
  return (
    <div
      className="flex items-center justify-center rounded-lg border-2 border-dashed border-slate-600/60 bg-slate-900/40"
      style={{ minHeight }}
    >
      <div className="flex flex-col items-center gap-1 px-4 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-slate-500"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
          {label || "Ad Space"}
        </span>
        <span className="text-[9px] text-slate-600">
          {format} • {minHeight}px
        </span>
      </div>
    </div>
  );
}

export function AdSlot({
  adSlot,
  className,
  format = "auto",
  fullWidthResponsive = true,
  minHeight = 120,
  label,
}: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isAdLoaded = useRef(false);

  useEffect(() => {
    if (!adSlot || typeof window === "undefined" || isAdLoaded.current) {
      return;
    }

    // Check if this specific ins element already has an ad
    const insElement = adRef.current;
    if (insElement && insElement.getAttribute("data-adsbygoogle-status")) {
      isAdLoaded.current = true;
      return;
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isAdLoaded.current = true;
      } catch (error) {
        // Silently ignore "already has ads" errors
        if (error instanceof Error && error.message.includes("already have ads")) {
          isAdLoaded.current = true;
          return;
        }
        if (process.env.NODE_ENV !== "production") {
          console.warn("[AdSlot] Failed to initialize AdSense slot", error);
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [adSlot]);

  if (!adSlot) {
    return (
      <div className={["w-full", className].filter(Boolean).join(" ")}>
        <AdPlaceholder minHeight={minHeight} format={format} label={label} />
      </div>
    );
  }

  return (
    <div className={["w-full", className].filter(Boolean).join(" ")}>
      <ins
        ref={adRef}
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
