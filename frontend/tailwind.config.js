/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2E75B6',
          50: '#EBF3FB',
          100: '#D6E7F7',
          200: '#ADCFEF',
          300: '#85B7E7',
          400: '#5C9FDF',
          500: '#2E75B6',
          600: '#255E92',
          700: '#1C476E',
          800: '#13304A',
          900: '#0A1926',
        },
      },
      fontFamily: {
        sans: ['Noto Sans KR', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
