import type { Metadata, Viewport } from 'next'
import { Joan, Montserrat } from 'next/font/google'
import './globals.css'

const joan = Joan({ subsets: ['latin'], weight: '400', variable: '--font-joan' })
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' })

const siteUrl = 'https://chat2build.pro' // replace with your real domain
const siteName = 'Chat2Build'
const title = 'Chat2Build — Build Your First Mobile App with AI (4-Week Bootcamp)'
const description =
  'A 4-week, 12-class bootcamp for non-programmers: use AI to design, build with Flutter & Firebase, and publish your first app to Google Play and the App Store.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: `%s | ${siteName}`,
  },
  description,
  applicationName: siteName,
  keywords: [
    'AI app development bootcamp',
    'build mobile app with AI',
    'vibe coding bootcamp',
    'learn Flutter',
    'Flutter and Firebase course',
    'mobile app development for beginners',
    'no-code to code mobile apps',
    'publish app to Google Play',
    'publish app to App Store',
    'AI-assisted coding',
    'app development for non-programmers',
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
      name: 'Chat2Build: AI Web & Mobile App Development Bootcamp',
      description:
        'A 4-week, 12-class bootcamp teaching non-programmers how to build and publish mobile apps with AI: ideation, UI design, Git and GitHub, Flutter, Firebase, debugging, testing, and deployment to Google Play and the Apple App Store.',
      url: siteUrl,
      provider: { '@id': `${siteUrl}/#organization` },
      educationalLevel: 'Beginner',
      inLanguage: 'en',
      teaches: [
        'Turning an idea into an app (ideation and MVP thinking)',
        'UI/UX design and wireframing',
        'Version control with Git and GitHub',
        'Flutter and Dart fundamentals',
        'Firebase authentication, database, and storage',
        'AI-assisted coding and debugging',
        'Building an Android APK/AAB and iOS build',
        'Publishing to Google Play and the Apple App Store',
      ],
      timeRequired: 'P4W',
      numberOfCredits: undefined,
      // Add these once you have the details:
      // hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Online', startDate: '2026-11-01' },
      // offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', url: `${siteUrl}/#pricing` },
    },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${joan.variable} ${montserrat.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        {children}
      </body>
    </html>
  )
}