import type { Metadata, Viewport } from 'next'
import Providers from '@/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title:       'LBrain — LBank AI Assistant',
  description: 'AI-powered LBank co-pilot. Live markets, trading assistant, portfolio tracker.',
  icons:       { icon: '/favicon.ico' },
  openGraph: {
    title:       'LBrain',
    description: 'AI-powered LBank assistant',
    type:        'website',
  },
}

export const viewport: Viewport = {
  width:      'device-width',
  initialScale: 1,
  themeColor: '#09090f',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
