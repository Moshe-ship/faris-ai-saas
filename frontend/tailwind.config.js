/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Saudi Green
        primary: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#006C35',
          600: '#005A2B',
          700: '#004D25',
          800: '#003D1D',
          900: '#002D15',
        },
        // Gold/Sand
        secondary: {
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#C4A052',
          600: '#B8943E',
          700: '#A67C00',
          800: '#8C6800',
          900: '#725500',
        },
        // Warm neutrals
        neutral: {
          50: '#FAFAF8',
          100: '#F5F3EE',
          200: '#E8E6E1',
          300: '#D4D2CD',
          400: '#A8A6A1',
          500: '#7C7A75',
          600: '#5C5A55',
          700: '#4A4A45',
          800: '#2A2A25',
          900: '#1A1A18',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans Arabic', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
