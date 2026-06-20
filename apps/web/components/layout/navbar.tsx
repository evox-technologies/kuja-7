'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LanguageToggle from '@/components/layout/language-toggle'
import { useI18n } from '@/lib/i18n/use-i18n'

export default function Navbar() {
  const { messages, t } = useI18n()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Link href="/" className="text-lg sm:text-xl font-bold tracking-widest text-gray-900">
          {messages.nav.brand}
        </Link>

        <ul className="hidden lg:flex items-center gap-8">
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

        <div className="hidden sm:flex items-center gap-3">
          <LanguageToggle />
          <Button variant="outline" size="sm" className="rounded-full" asChild>
            <Link href="/login">{t('nav.login')}</Link>
          </Button>
          <Button size="sm" className="rounded-full" asChild>
            <Link href="/register">{t('nav.join')}</Link>
          </Button>
        </div>

        <button
          type="button"
          className="sm:hidden p-2 text-gray-600"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-4">
          <div className="flex justify-center">
            <LanguageToggle />
          </div>
          <ul className="space-y-2">
            {messages.nav.links.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="block py-2 text-sm text-gray-600"
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="rounded-full w-full" asChild>
              <Link href="/login">{t('nav.login')}</Link>
            </Button>
            <Button className="rounded-full w-full" asChild>
              <Link href="/register">{t('nav.join')}</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}
