/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#e9ebf1',
        phone: '#fbfaf8',
        ink: '#26262e',
        'ink-soft': '#5b5f69',
        muted: '#9a9ea8',
        line: '#efece6',
        brand: '#e8792f',
        'brand-soft': '#fdeee3',
        teal: '#1f9d8f',
        amber: '#dfa13c',
        coral: '#dd5f37',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      animation: {
        'screen-enter': 'screenEnter 0.45s ease both',
        'screen-exit': 'screenExit 0.22s ease both',
        'needle-sweep': 'needleSweep 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'live-pulse': 'livePulse 2.5s ease-in-out infinite',
        'art-reveal': 'artReveal 0.5s ease both 0.15s',
        blink: 'blink 1.2s infinite ease-in-out',
      },
      keyframes: {
        screenEnter: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'none' },
        },
        screenExit: {
          to: { opacity: '0', transform: 'translateY(-6px)' },
        },
        needleSweep: {
          from: { transform: 'rotate(0deg)', transformOrigin: '100px 96px' },
          to: { transform: 'none', transformOrigin: '100px 96px' },
        },
        livePulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.75' },
        },
        artReveal: {
          to: { opacity: '1' },
        },
        blink: {
          '0%, 70%, 100%': { opacity: '0.35', transform: 'translateY(0)' },
          '35%': { opacity: '1', transform: 'translateY(-2px)' },
        },
      },
    },
  },
  plugins: [],
}
