/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Preserving your dark mode setting
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '575px',  // Preserving your custom screen setting
      },
      keyframes: {
        slideInBoing: {
          '0%': { transform: 'translateX(-100%) scale(0.8)' },
          '50%': { transform: 'translateX(20px) scale(1.2)' },
          '70%': { transform: 'translateX(-10px) scale(0.9)' },
          '100%': { transform: 'translateX(0) scale(1)' }
        }
      },
      animation: {
        'slideInBoing': 'slideInBoing 1s ease-in-out'
      }
    },
  },
  plugins: [],
};