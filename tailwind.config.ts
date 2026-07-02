import type { Config } from "tailwindcss";

/**
 * Tailwind theme bridges the CSS design tokens (defined in app/globals.css)
 * into utility classes. This keeps a single source of truth: change a token
 * once and every utility / component follows.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "var(--bg-base)",
        glass: {
          DEFAULT: "var(--glass-bg)",
          border: "var(--glass-border)",
          hover: "var(--glass-hover)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          glow: "var(--accent-glow)",
        },
        content: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
        },
        // Theme-aware surfaces (raised areas, secondary buttons, fields).
        surface: {
          DEFAULT: "var(--surface)",
          hover: "var(--surface-hover)",
        },
        btn: {
          DEFAULT: "var(--btn-bg)",
          hover: "var(--btn-bg-hover)",
        },
        field: "var(--field-bg)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        glass: "20px",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
    },
  },
  plugins: [],
};

export default config;
