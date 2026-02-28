/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Titillium Web"', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        playfair: ['"Playfair Display"', 'serif'],
        titillium: ['"Titillium Web"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}