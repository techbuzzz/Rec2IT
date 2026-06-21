/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: {
          DEFAULT: '#0a0a0f',
          panel: '#14141c',
          card: '#1c1c28',
        },
        accent: {
          good: '#22c55e',
          warn: '#eab308',
          bad: '#ef4444',
          info: '#3b82f6',
        },
      },
      animation: {
        'pulse-fast': 'pulse 0.6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};