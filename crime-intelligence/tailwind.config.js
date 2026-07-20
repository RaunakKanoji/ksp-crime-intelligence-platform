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
        app: {
          background: "rgb(var(--ksp-bg) / <alpha-value>)",
          surface: "rgb(var(--ksp-surface) / <alpha-value>)",
          elevated: "rgb(var(--ksp-surface-elevated) / <alpha-value>)",
          border: "rgb(var(--ksp-border) / <alpha-value>)",
          divider: "rgb(var(--ksp-divider) / <alpha-value>)",
          primary: "rgb(var(--ksp-primary) / <alpha-value>)",
          "primary-hover": "rgb(var(--ksp-primary-hover) / <alpha-value>)",
          info: "rgb(var(--ksp-info) / <alpha-value>)",
          success: "rgb(var(--ksp-success) / <alpha-value>)",
          warning: "rgb(var(--ksp-warning) / <alpha-value>)",
          danger: "rgb(var(--ksp-danger) / <alpha-value>)",
          muted: "rgb(var(--ksp-muted) / <alpha-value>)",
        },
        ink: {
          primary: "rgb(var(--ksp-text-primary) / <alpha-value>)",
          secondary: "rgb(var(--ksp-text-secondary) / <alpha-value>)",
          muted: "rgb(var(--ksp-text-muted) / <alpha-value>)",
          inverse: "rgb(var(--ksp-text-inverse) / <alpha-value>)",
        },
      },
      borderRadius: {
        app: "var(--ksp-radius)",
        "app-sm": "var(--ksp-radius-sm)",
        "app-lg": "var(--ksp-radius-lg)",
      },
      boxShadow: {
        app: "var(--ksp-shadow)",
        "app-lg": "var(--ksp-shadow-lg)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
