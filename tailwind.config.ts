import type { Config } from "tailwindcss";

// RenTools design tokens.
// Palette is grounded in the tool-yard: graphite steel neutrals + a single
// restrained "signal amber" accent (evokes hi-vis/equipment tags without
// being a literal safety-vest yellow). No purple/blue AI-gradient defaults.
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        graphite: {
          25: "#FCFCFB",
          50: "#F7F7F5",
          100: "#EFEFEC",
          200: "#E4E4E1",
          300: "#CFCFCA",
          400: "#9E9E97",
          500: "#71716A",
          600: "#52524C",
          700: "#3A3A3D", // borders / secondary text, dark surfaces
          800: "#242426",
          900: "#18181A",
          950: "#121214", // dark bg
        },
        ink: {
          DEFAULT: "#1C1C1E", // light-mode primary text
          inverted: "#F5F5F2", // dark-mode primary text
        },
        signal: {
          50: "#FBF3E2",
          100: "#F5E3B9",
          300: "#E7BE71",
          400: "#DFAE51",
          500: "#D9A441", // primary accent — use sparingly
          600: "#B9862C",
          700: "#8F6721",
        },
        state: {
          success: "#3B8156",
          warning: "#B9862C",
          danger: "#B4432F",
          info: "#4C6B8A",
        },
      },
      fontFamily: {
        display: ["Manrope", "system-ui", "sans-serif"],
        body: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        lg: "14px",
        // intentionally no "2xl+" blobby radii — restraint per design direction
      },
      boxShadow: {
        // Subtle, single-layer depth only. No stacked/glow shadows.
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 1px 0 rgb(0 0 0 / 0.03)",
        raised: "0 2px 8px -2px rgb(0 0 0 / 0.10)",
      },
      spacing: {
        "safe-t": "env(safe-area-inset-top)",
        "safe-b": "env(safe-area-inset-bottom)",
      },
      maxWidth: {
        app: "480px", // mobile canvas cap even on wide desktop viewports
      },
      transitionTimingFunction: {
        app: "cubic-bezier(0.32, 0.72, 0, 1)", // restrained, sheet-like easing
      },
      keyframes: {
        "sheet-in": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
      },
      animation: {
        "sheet-in": "sheet-in 220ms cubic-bezier(0.32, 0.72, 0, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
