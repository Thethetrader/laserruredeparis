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
        background:     "var(--background)",
        "bg-soft":      "var(--background-soft)",
        "bg-elev":      "var(--background-elev)",
        "bg-hover":     "var(--background-hover)",
        border:         "var(--border)",
        "border-soft":  "var(--border-soft)",
        "border-strong":"var(--border-strong)",
        foreground:     "var(--foreground)",
        muted:          "var(--foreground-muted)",
        dim:            "var(--foreground-dim)",
        accent:         "var(--accent)",
        "accent-glow":  "var(--accent-glow)",
        "accent-deep":  "var(--accent-deep)",
        success:        "var(--success)",
        warning:        "var(--warning)",
        danger:         "var(--danger)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm:   "var(--radius-sm)",
        base: "var(--radius-base)",
        lg:   "var(--radius-lg)",
        xl:   "var(--radius-xl)",
      },
    },
  },
  plugins: [],
};

export default config;
