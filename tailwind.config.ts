import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── INSIGHT Design Token System ──────────────────────
      colors: {
        // Neutral scale (7 stops, no ad-hoc grays)
        neutral: {
          0: "#FFFFFF",
          50: "#FAFAFA",
          100: "#F2F3F5",
          200: "#E4E6EA",
          400: "#9AA0AC",
          600: "#5B6070",
          900: "#14161C",
        },
        // Semantic accents (4 roles each)
        blue: {
          tint:   "#EAF1FF",
          base:   "#2E6BFF",
          strong: "#1D4FD1",
          text:   "#163B99",
        },
        green: {
          tint:   "#E9F9EF",
          base:   "#1FA957",
          strong: "#16803F",
          text:   "#10602F",
        },
        amber: {
          tint:   "#FFF6E5",
          base:   "#E0A100",
          strong: "#B37E00",
          text:   "#7A5600",
        },
        red: {
          tint:   "#FDEBEC",
          base:   "#E23B3B",
          strong: "#B92C2C",
          text:   "#8A1F1F",
        },
        // Purple — AI/system intelligence ONLY
        purple: {
          tint:   "#F3EEFE",
          base:   "#7C4DE0",
          strong: "#5E33B8",
          text:   "#432680",
        },
        // Dark mode surfaces (designed separately, not inverted)
        dark: {
          bg:      "#0B0D12",
          surface: "#14171F",
          border:  "#262B36",
          text:    "#F2F3F5",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        // Tabular numerals for stats
        "stat-xl": ["2rem", { lineHeight: "1", fontVariantNumeric: "tabular-nums", fontWeight: "600" }],
        "stat-lg": ["1.5rem", { lineHeight: "1", fontVariantNumeric: "tabular-nums", fontWeight: "600" }],
        "stat-md": ["1.125rem", { lineHeight: "1", fontVariantNumeric: "tabular-nums", fontWeight: "600" }],
        "stat-sm": ["0.875rem", { lineHeight: "1", fontVariantNumeric: "tabular-nums", fontWeight: "500" }],
      },
      // ── Easing curves ─────────────────────────────────────
      // Only these 3 curves exist in the system
      transitionTimingFunction: {
        "out-entrance":  "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out-move":   "cubic-bezier(0.65, 0, 0.35, 1)",
        // linear is built-in
      },
      // ── Duration table ────────────────────────────────────
      transitionDuration: {
        micro:     "150ms",
        component: "200ms",
        panel:     "300ms",
        camera:    "750ms",
      },
      // ── Spacing ───────────────────────────────────────────
      spacing: {
        sidebar: "240px",
        "sidebar-collapsed": "64px",
        header: "52px",
        "status-bar": "40px",
      },
      borderRadius: {
        DEFAULT: "8px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        marker: "3px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "card-hover": "0 4px 12px 0 rgb(0 0 0 / 0.08), 0 1px 3px 0 rgb(0 0 0 / 0.04)",
        overlay: "0 20px 40px 0 rgb(0 0 0 / 0.12), 0 4px 12px 0 rgb(0 0 0 / 0.06)",
        panel: "0 0 0 1px rgb(0 0 0 / 0.05), 0 2px 8px 0 rgb(0 0 0 / 0.06)",
      },
      keyframes: {
        "pulse-critical": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "draw-check": {
          from: { strokeDashoffset: "100" },
          to: { strokeDashoffset: "0" },
        },
      },
      animation: {
        "pulse-critical": "pulse-critical 2000ms ease-in-out infinite",
        "fade-in": "fade-in 200ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-in-right": "slide-in-right 250ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-in-left": "slide-in-left 250ms cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 1.5s linear infinite",
        "draw-check": "draw-check 200ms cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
