import type { Metadata, Viewport } from 'next'
import Providers from '@/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title:       'LBrain — The AI Brain for LBank',
  description: 'AI-powered LBank co-pilot. Live markets, trading assistant, automated agent rules, portfolio tracker, and Telegram alerts.',
  icons:       { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  keywords:    ['LBank', 'crypto trading', 'AI trading assistant', 'LBank bot', 'crypto alerts', 'DeFi'],
  authors:     [{ name: 'LBrain' }],
  robots:      'index, follow',
  openGraph: {
    title:       'LBrain — The AI Brain for LBank',
    description: 'AI-powered LBank trading assistant with live markets, automated rules, and Telegram alerts.',
    type:        'website',
    siteName:    'LBrain',
    images:      [{ url: '/og-image.png', width: 1200, height: 630, alt: 'LBrain' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'LBrain — The AI Brain for LBank',
    description: 'AI-powered LBank trading assistant',
    images:      ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
  themeColor:   '#09090f',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
