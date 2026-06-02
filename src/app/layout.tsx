import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import 'react-notion-x/src/styles.css'
import 'prismjs/themes/prism-tomorrow.css'

const siteUrl = 'https://jo-takahashi.me'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Jo Takahashi',
    template: '%s | Jo Takahashi',
  },
  description: '高橋青（Jo Takahashi）のポートフォリオ。SRE・クラウドネイティブエンジニア。',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: 'Jo Takahashi | Portfolio',
  },
  twitter: { card: 'summary' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: '/' },
}

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: '高橋青',
  alternateName: 'Jo Takahashi',
  url: siteUrl,
  jobTitle: 'Site Reliability Engineer',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
