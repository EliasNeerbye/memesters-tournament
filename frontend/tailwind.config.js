/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        playpen: ['"PlaypenSans"', 'sans-serif'],
      },
      colors: {
        "primaryColor": "#516BAE",
        "secondaryColor": "#AE515B"
      },
    },
  },
  plugins: [],
};

