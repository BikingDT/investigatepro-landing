/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './apps/**/*.html',
    './blog/**/*.html',
    './resources/**/*.html',
    './sales-deck/**/*.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Lexend', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          950: '#080E1F',
          900: '#0C142E',
          800: '#0F1A3A',
          700: '#1A2744',
          600: '#2A3A5C',
          500: '#3D4F70',
        },
        cyan: {
          500: '#76DCEC',
          400: '#88E0EE',
          300: '#A8EAF3',
          200: '#C8F1F8',
          100: '#E8F9FC',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
