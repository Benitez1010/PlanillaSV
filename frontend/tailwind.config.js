/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#27316E',
        secondary: '#95BF1D',
        accent: '#B0DF38',
      },
    },
  },
  plugins: [],
}
