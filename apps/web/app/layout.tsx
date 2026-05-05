import type { Metadata } from 'next'
import { Nunito, Noto_Sans_Sinhala } from 'next/font/google'
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

export const metadata: Metadata = {
  title: 'Kuja7.lk — Sri Lanka\'s Matrimonial Platform',
  description: 'Find your life partner. Sri Lanka\'s trusted matrimonial platform.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} ${notoSinhala.variable} font-sans`}>{children}</body>
    </html>
  )
}
