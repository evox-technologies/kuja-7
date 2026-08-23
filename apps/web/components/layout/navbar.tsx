'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import Logo from '@/components/layout/logo'
import LanguageToggle from '@/components/layout/language-toggle'
import { useI18n } from '@/lib/i18n/use-i18n'
import { createClient } from '@/lib/supabase/client'
import UserMenu from '@/components/layout/user-menu'

export default function Navbar() {
  const { messages, t } = useI18n()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [signedIn, setSignedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) setSignedIn(!!session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const authButtons = (
    <div className="hidden lg:flex items-center gap-2">
      <Button variant="ghost" size="sm" className="rounded-full" asChild>
        <Link href="/login">{t('nav.login')}</Link>
      </Button>
      <Button size="sm" className="rounded-full shadow-sm shadow-md" asChild>
        <Link href="/register">{t('nav.join')}</Link>
      </Button>
    </div>
  )

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="mx-auto max-w-6xl px-4 lg:px-6 h-16 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="shrink-0 transition-opacity hover:opacity-80">
          <Logo className="text-2xl text-gray-900" />
        </Link>

        {/* Desktop links — pill nav with active highlight */}
        <ul className="hidden lg:flex items-center gap-1 rounded-full bg-gray-50 p-1">
          {messages.nav.links.map(({ label, href }) => {
            const activeLink = pathname === href
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                    activeLink
                      ? 'bg-white text-brand shadow-sm font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-2 lg:gap-3">
          <LanguageToggle />

          {/* Signed out: desktop auth buttons (mobile gets them in the menu below) */}
          {signedIn === false && authButtons}

          {/* Signed in: same notifications + avatar menu as the dashboard */}
          {signedIn === true && <UserMenu signOutRedirect="/" fallback={authButtons} />}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="lg:hidden grid place-items-center w-10 h-10 -mr-2 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="lg:hidden absolute top-full inset-x-0 overflow-hidden border-t border-gray-100 bg-white shadow-lg shadow-black/5"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {messages.nav.links.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="py-2.5 text-sm text-gray-700 hover:text-brand transition-colors"
                >
                  {label}
                </Link>
              ))}
              {signedIn === false && (
                <div className="flex gap-3 mt-3">
                  <Button variant="outline" className="rounded-full flex-1" asChild>
                    <Link href="/login" onClick={() => setOpen(false)}>
                      {t('nav.login')}
                    </Link>
                  </Button>
                  <Button className="rounded-full flex-1" asChild>
                    <Link href="/register" onClick={() => setOpen(false)}>
                      {t('nav.join')}
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
