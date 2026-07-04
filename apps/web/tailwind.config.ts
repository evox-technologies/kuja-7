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
          DEFAULT: '#E53856',
          50:  '#FFF0F3',
          100: '#FFD6DE',
          400: '#F0607A',
          500: '#E53856',
          600: '#C42D47',
          700: '#9E2239',
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
