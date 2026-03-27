/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        pitch: "#3B82F6",
        note: "#8B5CF6",
        freq: "#F59E0B",
        nwordle: "#22C55E",
        fwordle: "#14B8A6",
      },
    },
  },
  plugins: [],
};
