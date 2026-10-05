import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#11172f',
        cobalt: '#1712c6',
        'cobalt-dark': '#100c8e',
        lemon: '#f6dc18',
        lavender: '#f7f7fc',
        line: '#e8e8f0',
        muted: '#6e7084',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Arial', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 18px 50px rgba(21, 22, 83, 0.08)',
        phone: '0 18px 42px rgba(17, 23, 47, 0.2)',
      },
    },
  },
  plugins: [],
}
export default config
