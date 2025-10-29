import type { Metadata } from "next";
import "../styles/globals.css";
import { publicAsset } from "@/lib/public-asset";

const title = "DeFiCalc.io";
const description =
  "Make sharper DeFi moves with a modular analytics hub, strategy monitor, and collaborative toolkit.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title,
    description
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
