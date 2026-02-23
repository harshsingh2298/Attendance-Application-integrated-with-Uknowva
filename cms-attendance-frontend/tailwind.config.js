/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#B71C1C', // Change based on your brand color
        'primary-dark': '#8E1515'
      },
      fontFamily: {
        header: ['Raleway', 'sans-serif'],
        content: ['Poppins', 'sans-serif'],
      },
    }
  },
  
  plugins: [],
}
