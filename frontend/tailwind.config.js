/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090d16",
        surface: "#111827",
        "surface-card": "#162033",
        "surface-card-hover": "#1d2b45",
        border: "#1f2d47",
        "border-muted": "#162238",
        brand: {
          50: "#eef7ff",
          100: "#d9eeff",
          200: "#bce2ff",
          300: "#8ed1ff",
          400: "#57b7ff",
          500: "#2f97ff",
          600: "#1878f5",
          700: "#1160e1",
          800: "#144db6",
          900: "#16438f",
        },
        status: {
          safe: "#10b981",
          "safe-bg": "rgba(16, 185, 129, 0.12)",
          moderate: "#f59e0b",
          "moderate-bg": "rgba(245, 158, 11, 0.12)",
          priority: "#ef4444",
          "priority-bg": "rgba(239, 68, 68, 0.12)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};
