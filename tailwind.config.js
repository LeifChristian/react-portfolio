/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Preserving your dark mode setting
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        grotesk: ['"Hanken Grotesk"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      },
      screens: {
        'xs': '575px',  // Preserving your custom screen setting
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};