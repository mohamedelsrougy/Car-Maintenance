/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 10px 25px -12px rgba(15, 23, 42, 0.15)',
      },
    },
  },
  plugins: [],
}

