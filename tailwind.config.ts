import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#34F5C5",
          foreground: "#041F1A"
        },
        accent: {
          DEFAULT: "#8B5CF6",
          foreground: "#0F172A"
        }
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(52, 245, 197, 0.45)"
      },
      backgroundImage: {
        "hero-grid": "radial-gradient(circle at 1px 1px, rgba(52,245,197,0.18) 1px, transparent 0)",
        "glow-ring": "conic-gradient(from 180deg at 50% 50%, rgba(52,245,197,0.25), rgba(139,92,246,0.4), rgba(52,245,197,0.25))"
      }
    }
  },
  plugins: []
};

export default config;
