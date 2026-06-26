'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import LanguageToggle from '@/components/layout/language-toggle'
import { useI18n } from '@/lib/i18n/use-i18n'

export default function Navbar() {
  const { messages, t } = useI18n()

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-widest text-gray-900">
          {messages.nav.brand}
        </Link>

        <ul className="flex items-center gap-8">
          {messages.nav.links.map(({ label, href }) => (
            <li key={href}>
              <Link
                href={href}
                className="text-sm text-gray-600 hover:text-brand transition-colors"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <LanguageToggle />

          <Button variant="outline" size="sm" className="rounded-full" asChild>
            <Link href="/login">{t('nav.login')}</Link>
          </Button>

          <Button size="sm" className="rounded-full" asChild>
            <Link href="/register">{t('nav.join')}</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
