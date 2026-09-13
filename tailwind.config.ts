import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Legacy light-theme tokens (used by chat components) ─────────────
        ink: '#12151C',
        paper: '#F7F6F3',
        slate: '#5B6270',
        accent: '#2F6F5E',
        accentSoft: '#E4EEEA',
        line: '#DDD9D0',
        danger: '#B3432B',
        // ── Theme-aware design tokens (switches dynamically via data-theme) ──
        void: 'rgb(var(--color-void-rgb) / <alpha-value>)',
        surface: 'rgb(var(--color-surface-rgb) / <alpha-value>)',
        surfaceHi: 'rgb(var(--color-surface-hi-rgb) / <alpha-value>)',
        neon: 'rgb(var(--color-neon-rgb) / <alpha-value>)',
        nebula: 'rgb(var(--color-nebula-rgb) / <alpha-value>)',
        starlight: 'rgb(var(--color-starlight-rgb) / <alpha-value>)',
        moon: 'rgb(var(--color-moon-rgb) / <alpha-value>)',
        cosmicBorder: 'rgb(var(--color-border-rgb) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        chat: '18px',
      },
      keyframes: {
        // Legacy chat animations
        'panel-in': {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'dot-bounce': {
          '0%, 80%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '40%': { transform: 'translateY(-3px)', opacity: '1' },
        },
        // New dark-theme animations
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'node-pulse': {
          '0%, 100%': { r: '4', opacity: '0.7' },
          '50%': { r: '6', opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'panel-in': 'panel-in 180ms ease-out',
        'dot-bounce': 'dot-bounce 1.2s infinite ease-in-out',
        'fade-up': 'fade-up 0.6s ease-out forwards',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin-slow 20s linear infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(ellipse 800px 600px at var(--mouse-x, 50%) var(--mouse-y, 40%), rgba(56,189,248,0.08) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow-neon': '0 0 20px rgba(56,189,248,0.3), 0 0 60px rgba(56,189,248,0.1)',
        'glow-nebula': '0 0 20px rgba(129,140,248,0.3)',
        'card-dark': '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05) inset',
        'card-hover': '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(56,189,248,0.2)',
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
};

export default config;
