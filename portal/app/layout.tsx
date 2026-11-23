import type { Metadata } from 'next'
import { Montserrat, Joan } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const joan = Joan({
  subsets: ['latin'],
  variable: '--font-joan',
  weight: ['400'],
})

export const metadata: Metadata = {
  title: 'Chat2Build Student Portal — Your Classroom',
  description: 'Access your 2-Week AI Web App Bootcamp video lessons, lecture slides, and coding resources.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${joan.variable}`}>
      <body className="min-h-screen bg-[#fafafc] text-ink antialiased">
        {children}
      </body>
    </html>
  )
}
