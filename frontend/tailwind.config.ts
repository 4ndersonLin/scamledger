import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#f8fafc',
          raised: '#ffffff',
          sunken: '#f1f5f9',
        },
        border: {
          DEFAULT: '#e2e8f0',
          subtle: '#cbd5e1',
        },
        'text-primary': '#334155',
        'text-secondary': '#64748b',
        'text-muted': '#94a3b8',
        accent: {
          DEFAULT: '#3b82f6',
          developer: '#2563eb',
        },
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#22c55e',
      },
      fontFamily: {
        heading: ['Barlow', '"Noto Sans TC"', 'sans-serif'],
        body: ['Barlow', '"Noto Sans TC"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
