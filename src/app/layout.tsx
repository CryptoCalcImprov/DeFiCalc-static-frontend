import type { Metadata } from "next";

import "../styles/globals.css";
import { publicAsset } from "@/lib/public-asset";

const title = "DeFiCalc.io";
const description =
  "Make sharper DeFi moves with a modular analytics hub, strategy monitor, and collaborative toolkit.";
const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const siteUrl =
  rawSiteUrl && /^https?:\/\//.test(rawSiteUrl)
    ? rawSiteUrl
    : "https://cryptocalcimprov.github.io/DeFiCalc-static-frontend";
const canonicalUrl = siteUrl.replace(/\/$/, "");
const ogImage = publicAsset("/assets/defi-calc-logo.png");

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL(canonicalUrl),
  keywords: [
    "DeFi analytics",
    "crypto dashboards",
    "Nova AI",
    "yield strategies",
    "governance insights",
    "liquidity monitoring",
    "calculator sandbox"
  ],
  authors: [{ name: "Nova Labs" }],
  alternates: {
    canonical: canonicalUrl
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: canonicalUrl,
    siteName: "DeFiCalc.io",
    images: [
      {
        url: ogImage,
        width: 1080,
        height: 1080,
        alt: "DeFiCalc.io Nova-powered analytics workspace"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage]
  },
  icons: {
    icon: [
      { url: publicAsset("/icons/favicon.svg"), type: "image/svg+xml" },
      { url: publicAsset("/icons/favicon-96x96.png"), type: "image/png", sizes: "96x96" }
    ],
    apple: { url: publicAsset("/icons/apple-touch-icon.png"), sizes: "180x180" },
    shortcut: publicAsset("/icons/favicon.ico")
  },
  manifest: publicAsset("/icons/site.webmanifest")
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-hidden bg-background text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
