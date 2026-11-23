import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#11172f',
        cobalt: '#090BC2',
        'cobalt-dark': '#080981',
        primary: '#090BC2',
        lemon: '#f6dc18',
        lavender: '#f7f7fc',
        line: '#e8e8f0',
        muted: '#6e7084',
      },
      fontFamily: {
        sans: ['var(--font-montserrat)', 'Arial', 'sans-serif'],
        display: ['var(--font-joan)', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 18px 50px rgba(21, 22, 83, 0.08)',
        play: '0 20px 60px -15px rgba(9, 11, 194, 0.25)',
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
      },
    },
  },
  plugins: [],
}

export default config
