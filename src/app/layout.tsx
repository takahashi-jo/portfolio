import type { Metadata } from 'next'
import './globals.css'
import 'react-notion-x/src/styles.css'
import 'prismjs/themes/prism-tomorrow.css'

export const metadata: Metadata = {
  title: 'Jo Takahashi',
  description: 'SRE | Cloud Native Engineer',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
