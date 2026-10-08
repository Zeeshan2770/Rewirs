import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#08090b",
          900: "#0c0d10",
          850: "#111318",
          800: "#16181e",
          700: "#212430",
        },
        ink: {
          100: "#f4f5f7",
          300: "#c7cad1",
          500: "#8b8f9a",
          700: "#5a5e69",
        },
        accent: {
          DEFAULT: "#c9a15a",
          soft: "#e4c98a",
          dim: "#8a7038",
        },
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "serif"],
      },
      borderRadius: {
        xl: "0.85rem",
        "2xl": "1.25rem",
      },
      maxWidth: {
        prose: "68ch",
      },
    },
  },
  plugins: [],
};

export default config;
