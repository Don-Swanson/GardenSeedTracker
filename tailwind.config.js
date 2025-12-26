/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        garden: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        soil: {
          50: '#faf5f0',
          100: '#f0e6d8',
          200: '#e0c9ad',
          300: '#cfa97d',
          400: '#c08f58',
          500: '#b17a42',
          600: '#9a6337',
          700: '#7d4d2e',
          800: '#66402a',
          900: '#553727',
        },
      },
    },
  },
  plugins: [],
}
