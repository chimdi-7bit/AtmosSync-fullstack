/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Light Mode Defaults
        "primary": "#0096b4",
        "secondary": "#5a61a6",
        "tertiary": "#8c6300",
        "error": "#ba1a1a",
        "surface": "#f8f9ff",
        "on-surface": "#111b2e",
        "on-surface-variant": "#40484c",
        "outline": "#70787d",
        "background": "#f0f4f9",
        
        // Dark Mode Override (mapped to standard Tailwind names for ease of use with .dark class)
        "dark": {
          "secondary-fixed-dim": "#bdc2ff",
          "inverse-primary": "#00677f",
          "on-error": "#690005",
          "surface-container-highest": "#27354c",
          "on-secondary-container": "#a8afff",
          "on-secondary": "#1b247f",
          "tertiary-fixed-dim": "#ffba4a",
          "surface-dim": "#041329",
          "on-secondary-fixed-variant": "#343d96",
          "on-tertiary-fixed-variant": "#624000",
          "surface-tint": "#47d6ff",
          "on-background": "#d6e3ff",
          "on-tertiary-container": "#6c4700",
          "primary": "#00d2ff",
          "primary-fixed-dim": "#47d6ff",
          "tertiary": "#ffd79f",
          "surface-container-lowest": "#010e24",
          "secondary-container": "#343d96",
          "surface-container-high": "#1c2a41",
          "on-primary-container": "#00566a",
          "outline": "#859399",
          "inverse-surface": "#d6e3ff",
          "tertiary-fixed": "#ffddb1",
          "surface-container": "#112036",
          "inverse-on-surface": "#233148",
          "secondary-fixed": "#e0e0ff",
          "background": "#041329",
          "on-surface-variant": "#bbc9cf",
          "primary-fixed": "#b6ebff",
          "on-primary": "#003543",
          "outline-variant": "#3c494e",
          "on-primary-fixed-variant": "#004e60",
          "surface-variant": "#27354c",
          "primary-container": "#00d2ff",
          "on-error-container": "#ffdad6",
          "surface": "#041329",
          "surface-bright": "#2c3951",
          "error": "#ffb4ab",
          "error-container": "#93000a",
          "secondary": "#bdc2ff",
          "on-surface": "#d6e3ff",
          "on-tertiary-fixed": "#291800",
          "tertiary-container": "#ffb229",
          "on-primary-fixed": "#001f28",
          "on-secondary-fixed": "#000767",
          "surface-container-low": "#0d1c32",
          "on-tertiary": "#442b00"
        }
      },
      borderRadius: {
        "DEFAULT": "1rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "full": "9999px"
      },
      fontFamily: {
        "headline": ["Inter"],
        "body": ["Inter"],
        "label": ["Space Grotesk"]
      }
    },
  },
  plugins: [],
}
