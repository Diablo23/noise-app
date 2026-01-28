/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'noise-orange': '#DF4E3B',
        'noise-orange-dark': '#C94432',
      },
      fontFamily: {
        'rubik-glitch': ['"Rubik Glitch"', 'cursive'],
        'kapakana': ['Kapakana', 'cursive'],
        'shadows': ['"Shadows Into Light"', 'cursive'],
      },
    },
  },
  plugins: [],
}
