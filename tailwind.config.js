/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // Enable dark mode based on class
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f1fe',
          100: '#cce3fd',
          200: '#99c7fb',
          300: '#66aaf9',
          400: '#338ef7',
          500: '#0072f5', // Primary color
          600: '#005bc4',
          700: '#004493',
          800: '#002e62',
          900: '#001731',
        },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
};