import type { Metadata, Viewport } from 'next'
import { Joan, Montserrat } from 'next/font/google'
import './globals.css'
import { SourceTracker } from './components/SourceTracker'

const joan = Joan({ subsets: ['latin'], weight: '400', variable: '--font-joan' })
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' })

const siteUrl = 'https://chat2build.pro' // replace with your real domain
const siteName = 'Chat2Build'
const title = 'Chat2Build — Build Your First Web App with AI (2-Week Bootcamp)'
const description =
  'A 2-week intensive bootcamp for non-programmers: use AI to design, build, and deploy production-ready web applications with zero prior coding experience. Commences November 22, 2026.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: `%s | ${siteName}`,
  },
  description,
  applicationName: siteName,
  keywords: [
    'AI web app development bootcamp',
    'build web app with AI',
    'vibe coding bootcamp',
    'learn Next.js and Firebase',
    'web app development for beginners',
    'no-code to code web apps',
    'deploy web app to custom domain',
    'AI-assisted coding',
    'web development for non-programmers',
    'Git and GitHub for beginners',
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  category: 'education',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName,
    title,
    description,
    locale: 'en_US',
    // Add app/opengraph-image.png (1200x630) and Next.js wires it up automatically,
    // or uncomment this to point to a file in /public:
    images: [{ url: '/logo.png', width: 1200, height: 630, alt: 'Chat2Build — Build your first mobile app with AI' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    // creator: '@yourhandle',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  verification: { google: 'your-search-console-token' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#080981',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: siteName,
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
      // sameAs: ['https://x.com/...', 'https://www.instagram.com/...'],
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: siteName,
      description,
      publisher: { '@id': `${siteUrl}/#organization` },
      inLanguage: 'en',
    },
    {
      '@type': 'Course',
      '@id': `${siteUrl}/`,
      name: 'Chat2Build: AI Web App Development Bootcamp',
      description:
        'A 2-week intensive bootcamp teaching non-programmers how to build, test, and deploy production-ready web applications using AI: ideation, UI design, Git and GitHub, Stitch, Firebase, SEO, and live cloud deployment.',
      url: siteUrl,
      provider: { '@id': `${siteUrl}/#organization` },
      educationalLevel: 'Beginner',
      inLanguage: 'en',
      teaches: [
        'Turning an idea into a web app (ideation and MVP thinking)',
        'UI/UX design and wireframing with Stitch',
        'Version control with Git and GitHub',
        'Firebase authentication, database, and storage',
        'AI-assisted coding and debugging with modern AI agents',
        'SEO optimization and web analytics setup',
        'Deploying live to production with custom domains',
      ],
      timeRequired: 'P2W',
      numberOfCredits: undefined,
    },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${joan.variable} ${montserrat.variable}`}>
      <body>
        <SourceTracker />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        {children}
      </body>
    </html>
  )
}