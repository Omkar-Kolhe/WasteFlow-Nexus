import type { Config } from 'tailwindcss'

/**
 * WasteFlow Nexus design tokens.
 * Dark-first, restrained luminance. One signal accent, three semantic hues.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        white: 'rgb(var(--color-ink) / <alpha-value>)',
        black: 'rgb(var(--color-void) / <alpha-value>)',
        void: 'rgb(var(--color-void) / <alpha-value>)',
        base: 'rgb(var(--color-base) / <alpha-value>)',
        panel: 'rgb(var(--color-panel) / <alpha-value>)',
        raised: 'rgb(var(--color-raised) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          dim: 'rgb(var(--color-ink-dim) / <alpha-value>)',
          faint: 'rgb(var(--color-ink-faint) / <alpha-value>)',
          ghost: 'rgb(var(--color-ink-ghost) / <alpha-value>)',
        },
        signal: {
          DEFAULT: 'rgb(var(--color-signal) / <alpha-value>)',
          dim: 'rgb(var(--color-signal-dim) / <alpha-value>)',
          deep: 'rgb(var(--color-signal-deep) / <alpha-value>)',
        },
        flow: {
          DEFAULT: 'rgb(var(--color-flow) / <alpha-value>)',
          dim: 'rgb(var(--color-flow-dim) / <alpha-value>)',
        },
        warn: {
          DEFAULT: 'rgb(var(--color-warn) / <alpha-value>)',
          dim: 'rgb(var(--color-warn-dim) / <alpha-value>)',
        },
        critical: {
          DEFAULT: 'rgb(var(--color-critical) / <alpha-value>)',
          dim: 'rgb(var(--color-critical-dim) / <alpha-value>)',
        },
        organic: 'rgb(var(--color-organic) / <alpha-value>)',
        polymer: 'rgb(var(--color-polymer) / <alpha-value>)',
        glass: 'rgb(var(--color-glass) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        micro: ['0.5625rem', { lineHeight: '0.875rem', letterSpacing: '0.14em' }],
        label: ['0.625rem', { lineHeight: '0.875rem', letterSpacing: '0.12em' }],
        data: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.06em' }],
      },
      borderColor: {
        hair: 'var(--color-hair)',
        hair2: 'var(--color-hair2)',
      },
      backgroundColor: {
        hair: 'var(--bg-hair)',
      },
      boxShadow: {
        panel: '0 1px 0 var(--color-hair) inset, 0 24px 60px -24px rgba(0,0,0,0.9)',
        glow: '0 0 0 1px rgb(var(--color-signal) / 0.28), 0 0 28px -6px rgb(var(--color-signal) / 0.35)',
        inset: 'inset 0 1px 0 var(--color-hair)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.72)', opacity: '0.55' },
          '70%': { transform: 'scale(1.5)', opacity: '0' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        'status-pulse': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgb(var(--color-signal) / 0.5)' },
          '50%': { opacity: '0.72', boxShadow: '0 0 0 5px rgb(var(--color-signal) / 0)' },
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '35%': { opacity: '0.6' },
          '100%': { transform: 'translateY(1200%)', opacity: '0' },
        },
        'drift': {
          '0%, 100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-6px,0)' },
        },
        'sweep': {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        'flicker': {
          '0%, 100%': { opacity: '0.85' },
          '45%': { opacity: '1' },
          '55%': { opacity: '0.7' },
        },
        'route-flow': {
          to: { backgroundPosition: '26px 0' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2.8s cubic-bezier(0.22,0.61,0.36,1) infinite',
        'status-pulse': 'status-pulse 2.4s ease-in-out infinite',
        scan: 'scan 5.5s linear infinite',
        drift: 'drift 7s ease-in-out infinite',
        sweep: 'sweep 2.6s cubic-bezier(0.4,0,0.2,1) infinite',
        flicker: 'flicker 3.2s ease-in-out infinite',
      },
      transitionTimingFunction: {
        nexus: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}

export default config
