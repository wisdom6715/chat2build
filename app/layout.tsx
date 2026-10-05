import type { Metadata } from 'next'
import { Joan, Montserrat } from 'next/font/google'
import './globals.css'

const joan = Joan({ subsets: ['latin'], weight: '400', variable: '--font-joan' })
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' })

export const metadata: Metadata = {
  title: 'Chat2Build — Build your first mobile app with AI',
  description: 'A four-week bootcamp for shipping your first real mobile app with AI.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${joan.variable} ${montserrat.variable}`}>
      <body>{children}</body>
    </html>
  )
}