import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        accent: {
          500: "#8b5cf6",
          600: "#7c3aed",
        }
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(99, 102, 241, 0.25)",
        "glow-lg": "0 0 40px -5px rgba(99, 102, 241, 0.35)",
        "card-hover": "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)",
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        }
      }
    },
  },
  plugins: [],
};
export default config;
