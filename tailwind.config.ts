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
          DEFAULT: "#14B8A6",
          foreground: "#002521"
        },
        highlight: {
          DEFAULT: "#6D4AFF",
          foreground: "#F5F0FF"
        },
        midnight: "#050B16",
        deep: "#0C1A2B",
        abyss: "#081121",
        muted: "#8CA2B6",
        success: "#22D3A6",
        warning: "#F59E0B",
        danger: "#F87171"
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(20, 184, 166, 0.35)",
        panel: "0 25px 60px -30px rgba(13, 59, 102, 0.55)"
      }
    }
  },
  plugins: []
};

export default config;
