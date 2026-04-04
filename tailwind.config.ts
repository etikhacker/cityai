import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        syne: ['var(--font-syne)', 'sans-serif'],
        dm:   ['var(--font-dm)',   'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
