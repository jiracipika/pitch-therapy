/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#1C1C1E',
        'surface-elevated': '#2C2C2E',
        card: '#1C1C1E',
        border: 'rgba(255,255,255,0.08)',
        text: '#FFFFFF',
        muted: '#8E8E93',
        tertiary: '#636366',
        apple: {
          blue: '#0A84FF',
          purple: '#BF5AF2',
          pink: '#FF375F',
          red: '#FF453A',
          orange: '#FF9F0A',
          yellow: '#FFD60A',
          green: '#30D158',
          teal: '#64D2FF',
          indigo: '#5E5CE6',
        },
      },
      borderRadius: {
        apple: 14,
        'apple-lg': 18,
        'apple-xl': 22,
      },
      fontFamily: {
        sf: ['System', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text'],
      },
    },
  },
  plugins: [],
};
