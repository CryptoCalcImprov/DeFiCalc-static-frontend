import type { Metadata } from "next";
import "../styles/globals.css";

const title = "CryptoCalc.io";
const description = "A reusable Next.js + Tailwind CSS framework ready for static deployment on GitHub Pages.";

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
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
