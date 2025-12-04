import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";

import "../styles/globals.css";
import { publicAsset } from "@/lib/public-asset";

const goldman = localFont({
  src: [
    {
      path: "../../public/fonts/Goldman-Bold.ttf",
      weight: "700",
      style: "normal"
    }
  ],
  display: "swap",
  variable: "--font-goldman"
});

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${goldman.variable} min-h-screen overflow-x-hidden bg-background text-slate-100 antialiased`}>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-1TTB6P1KQ6" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-1TTB6P1KQ6');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
