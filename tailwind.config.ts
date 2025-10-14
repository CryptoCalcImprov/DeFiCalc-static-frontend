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
          DEFAULT: "#1A73E8",
          foreground: "#FFFFFF"
        },
        accent: {
          DEFAULT: "#F9AB00",
          foreground: "#1A1A1A"
        }
      }
    }
  },
  plugins: []
};

export default config;
