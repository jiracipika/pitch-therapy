/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // MedBrewery-family accents (ink-safe on paper, still vivid on midnight ink)
        pitch: "#2563eb",
        note: "#6d5bd0",
        freq: "#b45309",
        nwordle: "#00a06a",
        fwordle: "#0f766e",
      },
    },
  },
  plugins: [],
};
