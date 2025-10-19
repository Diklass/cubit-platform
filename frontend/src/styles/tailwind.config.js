/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
      colors: {
        cubit: {
          bg: '#F0F5FA',
          surface: '#FFFFFF',
          primary: '#3C96EF',
          'primary-hover': '#2F7DD6',
          gray: '#626466',
          'gray-light': '#CED2D6',
          black: '#000000',
          white: '#FFFFFF',
          error: '#E53935',
          success: '#43A047',
          warning: '#F9A825',
        },
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '32px',
        pill: '100px',
      },
      boxShadow: {
        light: '0px 2px 6px rgba(60, 150, 239, 0.08), 0px 4px 12px rgba(60, 150, 239, 0.06)',
        medium: '0px 4px 8px rgba(60, 150, 239, 0.12), 0px 6px 20px rgba(60, 150, 239, 0.08)',
        strong: '0px 6px 10px rgba(60, 150, 239, 0.16), 0px 12px 24px rgba(60, 150, 239, 0.10)',
      },
      spacing: {
        pageX: '20px',
        pageY: '22px',
        gapX: '15px',
        gapY: '10px',
      },
      transitionDuration: {
        fast: '200ms',
        normal: '300ms',
      },
    },
  },
  plugins: [],
}
