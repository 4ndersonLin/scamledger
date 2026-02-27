import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0a0e1a',
          900: '#0d1321',
          800: '#131b2e',
          700: '#1a2540',
          600: '#243052',
        },
        slate: {
          200: '#c8d0e0',
          300: '#a8b2c8',
          400: '#8892a8',
        },
        'blue-accent': '#3b82f6',
        threat: {
          red: '#e63946',
          amber: '#f59e0b',
          green: '#10b981',
        },
        gold: '#c9a84c',
      },
      fontFamily: {
        heading: ['"Barlow Condensed"', 'sans-serif'],
        body: ['Barlow', '"Noto Sans TC"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
