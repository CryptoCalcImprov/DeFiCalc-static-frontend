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
          DEFAULT: "#1D69A3",
          foreground: "#F5FBFF"
        },
        accent: {
          DEFAULT: "#6D4AFF",
          foreground: "#F5FBFF"
        },
        brand: {
          deep: "#050B16",
          navy: "#0C1A2B",
          midnight: "#07111F",
          teal: "#14B8A6",
          aqua: "#28C9B9",
          blue: "#0D3B66"
        },
        slateglass: "rgba(18, 32, 56, 0.7)",
        success: "#34D399",
        warning: "#F59E0B",
        danger: "#F87171"
      },
      boxShadow: {
        glow: "0 0 40px rgba(20, 184, 166, 0.25)",
        card: "0 20px 40px -24px rgba(15, 23, 42, 0.6)"
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(120% 120% at 50% 0%, rgba(13, 59, 102, 0.5) 0%, rgba(12, 26, 43, 0.92) 50%, rgba(7, 17, 31, 1) 100%)",
        "card-glass": "linear-gradient(135deg, rgba(19, 33, 58, 0.9), rgba(7, 17, 31, 0.8))",
        "cta-gradient": "linear-gradient(135deg, #1D69A3 0%, #14B8A6 100%)"
      }
    }
  },
  plugins: []
};

export default config;
