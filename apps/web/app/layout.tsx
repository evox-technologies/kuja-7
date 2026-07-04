import type { Metadata, Viewport } from 'next'
import { Nunito, Noto_Sans_Sinhala, Playfair_Display } from 'next/font/google'
import ScaleDetector from '@/components/layout/scale-detector'
import LanguageSync from '@/components/providers/language-sync'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
})

const notoSinhala = Noto_Sans_Sinhala({
  subsets: ['sinhala'],
  variable: '--font-sinhala',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Kuja7.lk — Sri Lanka\'s Matrimonial Platform',
  description: 'Find your life partner. Sri Lanka\'s trusted matrimonial platform.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-scale-root suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=typeof CSS!=='undefined'&&CSS.supports('zoom','1');document.documentElement.classList.add(s?'supports-zoom':'no-zoom');})();`,
          }}
        />
      </head>
      <body className={`${nunito.variable} ${notoSinhala.variable} ${playfair.variable} font-sans`}>
        <ScaleDetector />
        <LanguageSync />
        <div id="viewport-canvas">{children}</div>
      </body>
    </html>
  )
}
