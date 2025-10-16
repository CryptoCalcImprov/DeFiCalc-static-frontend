import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#050B16",
        surface: "#0C1A2B",
        primary: {
          DEFAULT: "#1D69A3",
          foreground: "#F4FAFF"
        },
        mint: {
          DEFAULT: "#28C9B9",
          foreground: "#022424"
        },
        ocean: "#0D3B66",
        lavender: "#6D4AFF",
        slate: {
          50: "#F5F8FC",
          100: "#E5ECF5",
          200: "#CBD7E8",
          300: "#A7BAD4",
          400: "#7F97BA",
          500: "#647CA5",
          600: "#4E648C",
          700: "#3F516F",
          800: "#2F3C53",
          900: "#1F2737"
        }
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at 20% 20%, rgba(40,201,185,0.16), transparent 55%), radial-gradient(circle at 80% 0%, rgba(13,59,102,0.4), transparent 60%)",
        "card-border": "linear-gradient(135deg, rgba(40,201,185,0.45), rgba(29,105,163,0.35))",
        "cta-gradient": "linear-gradient(120deg, #1D69A3 0%, #28C9B9 60%, #6D4AFF 100%)"
      }
    }
  },
  plugins: []
};

export default config;
