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
          foreground: "#E9F5FF"
        },
        secondary: {
          DEFAULT: "#14B8A6",
          foreground: "#022C22"
        },
        accent: {
          DEFAULT: "#6D4AFF",
          foreground: "#F5F3FF"
        },
        midnight: {
          DEFAULT: "#0C1A2B",
          200: "#132238",
          300: "#182C42",
          400: "#1F3650"
        },
        slateglass: "rgba(15, 34, 52, 0.75)",
        success: "#22D3A7",
        warning: "#F97316",
        danger: "#F87171"
      },
      boxShadow: {
        glow: "0 20px 45px -20px rgba(20, 184, 166, 0.45)",
        card: "0 14px 30px -18px rgba(15, 34, 52, 0.8)"
      },
      backgroundImage: {
        "grid-glow": "radial-gradient(circle at top left, rgba(29, 105, 163, 0.3), transparent 45%), radial-gradient(circle at bottom right, rgba(20, 184, 166, 0.35), transparent 50%)"
      }
    }
  },
  plugins: []
};

export default config;
