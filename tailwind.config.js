/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs"],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f4f7f4',
          100: '#e3ebe3',
          200: '#c5d6c5',
          300: '#a3bfa3',
          400: '#7f9f7f',
          500: '#8a9a5b', // Main Sage
          600: '#6d7a48',
          700: '#545f39',
          800: '#3e462d',
          900: '#2c3122',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
