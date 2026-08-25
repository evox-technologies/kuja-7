import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--color-brand)',
          hover: 'var(--color-brand-hover)',
          light: 'var(--color-brand-light)',
          border: 'var(--color-brand-border)',
          text: 'var(--color-brand-text)',
          'text-strong': 'var(--color-brand-text-strong)',
        },
        'on-brand': 'var(--color-on-brand)',
        success: {
          DEFAULT: 'var(--color-success)',
          bg: 'var(--color-success-bg)',
          border: 'var(--color-success-border)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          bg: 'var(--color-warning-bg)',
          border: 'var(--color-warning-border)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          bg: 'var(--color-danger-bg)',
          border: 'var(--color-danger-border)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          bg: 'var(--color-info-bg)',
          border: 'var(--color-info-border)',
        },
      },
      fontFamily: {
        sans: ['var(--font-nunito)', 'var(--font-sinhala)', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
      },
      screens: {
        design: '1280px',
      },
    },
  },
  plugins: [],
}

export default config
