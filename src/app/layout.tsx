import type { Metadata } from "next";
import "../styles/globals.css";

const title = "DeFiCalc.io";
const description = "A dark-mode design system concept for a DeFi analytics gateway, ready to expand with calculators and Nova AI.";

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
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-midnight text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
