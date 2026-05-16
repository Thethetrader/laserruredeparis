import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })
const instrument = Instrument_Serif({ variable: '--font-instrument', subsets: ['latin'], weight: '400', style: ['normal', 'italic'] })

export const metadata: Metadata = {
  title: 'ONKHALASS',
  description: 'Gérez votre budget en couple, simplement.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'ONKHALASS' },
}

export const viewport: Viewport = {
  themeColor: '#e07a5f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} ${instrument.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
