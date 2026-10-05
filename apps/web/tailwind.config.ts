import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        vahi: {
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#16a34a",
          600: "#15803d",
          700: "#166534",
        },
        tally: {
          blue: "#005a9e",
          darkblue: "#00477d",
          navy: "#144466",
          ribbon: "#1f618d",
          gold: "#ffbe00",
          lightgold: "#fff3cc",
          bg: "#f2f6fa",
          surface: "#eaf2f8",
          border: "#b0c4de",
          text: "#0f172a",
        },
        brand: {
          50: "#eaf2f8",
          100: "#d4e6f1",
          500: "#2980b9",
          600: "#005a9e",
          700: "#1f618d",
          800: "#144466",
          900: "#0b253a",
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        mono: ["'JetBrains Mono'", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.02)',
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
        'drawer': '-4px 0 24px -4px rgba(15, 23, 42, 0.1)',
      }
    },
  },
  plugins: [],
};
export default config;
