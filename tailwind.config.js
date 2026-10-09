/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        void: 'var(--color-void)',
        deep: 'var(--color-deep)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          obsidian: 'var(--color-surface-obsidian)',
          cosmic: 'var(--color-surface-cosmic)',
          elevated: 'var(--color-surface-elevated)',
          hover: 'var(--color-surface-hover)',
          border: 'var(--color-surface-border)',
          borderLight: 'var(--color-surface-border-light)',
        },
        text: {
          pure: 'var(--color-text-pure)',
          soft: 'var(--color-text-soft)',
          muted: 'var(--color-text-muted)',
          faint: 'var(--color-text-faint)',
        },
        brand: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          light: '#EEF2FF',
          dark: '#312E81',
          accent: '#FF5500',
        },
        status: {
          new: '#6366F1',
          inProgress: '#D97706',
          resolved: '#059669',
          waiting: '#64748B',
        },
        neon: {
          violet: 'var(--color-neon-violet)',
          electric: 'var(--color-neon-electric)',
          flame: '#FF5500',
          flameLight: '#FF7700',
          emerald: '#059669',
          amber: '#D97706',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card': '0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
        'elevated': '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
