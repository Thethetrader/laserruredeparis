/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8B4513',
        secondary: '#F5F5DC',
        beige: {
          50: '#FAF8F5',
          100: '#F2EDE6',
          200: '#E8D8C4',
          300: '#D4C0A1',
          400: '#C4A875',
          500: '#B59660',
          600: '#A0834A',
          700: '#8B6F3A',
          800: '#6B5530',
          900: '#4A3B20',
        },
      },
    },
  },
  plugins: [],
} 