import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        goldman: ["Goldman", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        background: "#061522",
        surface: "#0C2537",
        primary: {
          DEFAULT: "#7A40FF",
          foreground: "#F6FAFF"
        },
        mint: {
          DEFAULT: "#36D6C3",
          foreground: "#021F1D"
        },
        accent: {
          DEFAULT: "#3AC6FF",
          foreground: "#021F1D"
        },
        info: "#4A9CFF",
        success: "#40E0A7",
        caution: "#FFB347",
        critical: "#FF6F7D",
        ocean: "#11344B",
        lavender: "#8E58FF",
        slate: {
          50: "#F6FAFF",
          100: "#E6EFFA",
          200: "#CBD5E1",
          300: "#A7B9C9",
          400: "#889DB4",
          500: "#7E90A6",
          600: "#65768C",
          700: "#4C5C70",
          800: "#33485C",
          900: "#1F2E3D"
        }
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at 20% 20%, rgba(58,198,255,0.18), transparent 55%), radial-gradient(circle at 78% 0%, rgba(122,64,255,0.28), transparent 62%)",
        "card-border": "linear-gradient(135deg, rgba(58,198,255,0.42), rgba(122,64,255,0.32))",
        "cta-gradient": "linear-gradient(120deg, #7A40FF 0%, #3AC6FF 100%)"
      }
    }
  },
  plugins: []
};

export default config;
