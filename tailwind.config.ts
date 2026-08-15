import type { Config } from "tailwindcss";

// RenTools design tokens.
// Palette is grounded in the tool-yard: graphite steel neutrals as the base
// system, with a single warm amber "accent" scale reserved for primary CTAs
// (Enquire now, price highlights) per the updated homepage direction.
// No purple/blue AI-gradient defaults.
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
          50: "#F2F2F1",
          100: "#E4E4E1",
          300: "#9E9E97",
          400: "#52524C",
          500: "#1C1C1E", // primary accent — near-black, use sparingly
          600: "#101012",
          700: "#000000",
        },
        state: {
          success: "#3B8156",
          warning: "#B9862C",
          danger: "#B4432F",
          info: "#4C6B8A",
          // Text-safe variants: the base tones above are tuned for small
          // dots/solid backgrounds, and fail WCAG AA (4.5:1) as *text* on a
          // 10%-tint badge or on the opposite theme's page background —
          // see docs/DESIGN-AUDIT.md for the measured ratios. Each pair
          // below is verified >=4.5:1 for its own theme; use
          // `text-state-<tone>-text dark:text-state-<tone>-text-dark`
          // anywhere a state color wraps actual text (error copy, badge
          // labels), not for icons/dots, which fall under the more lenient
          // 3:1 non-text-contrast rule and already pass.
          "success-text": "#2F6B46",
          "success-text-dark": "#7DD0A0",
          "warning-text": "#8A5A12",
          "warning-text-dark": "#B9862C",
          "danger-text": "#B4432F",
          "danger-text-dark": "#E0796A",
          "info-text": "#4C6B8A",
          "info-text-dark": "#8FB4D9",
        },
        accent: {
          50: "#FFF8E6",
          100: "#FFEEC2",
          200: "#FFDD85",
          300: "#FDC847",
          400: "#F7B928",
          500: "#F0A81B", // primary CTA — "Enquire now", price highlights
          600: "#D68F0F",
          700: "#AD710C",
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
        "page-in": {
          from: { opacity: "0", transform: "translateY(8px) scale(0.99)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "page-out": {
          from: { opacity: "1", transform: "translateY(0) scale(1)" },
          to: { opacity: "0", transform: "translateY(-6px) scale(0.995)" },
        },
      },
      animation: {
        "sheet-in": "sheet-in 220ms cubic-bezier(0.32, 0.72, 0, 1)",
        // Route-change cross-fade: a short "out" on the leaving page
        // handed off to a slightly longer "in" on the entering page, both
        // on the same restrained sheet-like easing as the rest of the app.
        "page-in": "page-in 240ms cubic-bezier(0.32, 0.72, 0, 1) both",
        "page-out": "page-out 130ms cubic-bezier(0.32, 0.72, 0, 1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
