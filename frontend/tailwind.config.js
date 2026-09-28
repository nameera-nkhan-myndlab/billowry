/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#00D5D8', dark: '#00B3B6', soft: 'rgba(0,213,216,0.12)' },
        accent: { DEFAULT: '#7C3AED', soft: 'rgba(124,58,237,0.18)' },
        ink: '#E6EDF3',
        muted: '#8B98A9',
        line: '#243041',
        canvas: '#0B1017',
      },
      fontFamily: {
        serif: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        sans: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { card: '12px' },
      boxShadow: { card: '0 1px 2px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.35)' },
    },
  },
  plugins: [],
};