/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          blue: '#1e3a8a',  // Official-looking deep blue
          light: '#f3f4f6', // Light gray background
          accent: '#f59e0b', // Amber for alerts/highlights
        }
      }
    },
  },
  plugins: [],
}