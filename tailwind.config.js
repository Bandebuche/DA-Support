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
        neon: {
          violet: 'var(--color-neon-violet)',
          electric: 'var(--color-neon-electric)',
          flame: '#FF5500',
          flameLight: '#FF7700',
          emerald: '#10B981',
          emeraldGlow: 'rgba(16, 185, 129, 0.4)',
          amber: '#F59E0B',
          amberGlow: 'rgba(245, 158, 11, 0.35)',
        },
        nexus: {
          DEFAULT: '#8B5CF6',
          electric: '#A78BFA',
          deep: '#6D28D9',
          flame: '#FF5500',
          emerald: '#10B981',
          amber: '#F59E0B',
          glow: 'rgba(139, 92, 246, 0.25)',
          borderGlow: 'rgba(167, 139, 250, 0.4)',
        },
      },
      fontFamily: {
        sans: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        'nexus-glow': '0 0 30px -5px rgba(139, 92, 246, 0.25)',
        'nexus-sm': '0 0 15px -2px rgba(139, 92, 246, 0.3)',
        'neon-emerald': '0 0 25px -3px rgba(16, 185, 129, 0.4)',
        'neon-flame': '0 0 25px -3px rgba(255, 85, 0, 0.4)',
        'neon-amber': '0 0 25px -3px rgba(245, 158, 11, 0.35)',
        'neon-violet': '0 0 30px -5px rgba(139, 92, 246, 0.35)',
        'glass-hud': '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'hud-active': '0 0 25px -2px rgba(167, 139, 250, 0.35), 0 0 0 1px rgba(167, 139, 250, 0.4)',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.04)' },
        },
        'radar-ping': {
          '0%': { transform: 'scale(0.8)', opacity: '0.9' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'laser-sweep': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-ping': 'radar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'laser-sweep': 'laser-sweep 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
