'use client'

import Link from 'next/link'
import LanguageToggle from '@/components/layout/language-toggle'
import UserMenu from '@/components/layout/user-menu'
import { useI18n } from '@/lib/i18n/use-i18n'
import Logo from '@/components/layout/logo'

export default function DashboardNavbar() {
  const { t } = useI18n()

  return (
    <nav className="bg-white border-b border-gray-100 shrink-0">
      <div className="px-4 lg:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Link href="/" className="text-lg sm:text-xl font-bold tracking-widest text-gray-900">
         <Logo className="text-2xl" />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle />

          <UserMenu
            fallback={
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-brand transition-colors px-3 py-1.5"
                >
                  {t('dashboard.signIn')}
                </Link>
                <Link
                  href="/register"
                  className="flex items-center bg-brand text-on-brand text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full hover:bg-brand-hover transition-colors"
                >
                  {t('dashboard.register')}
                </Link>
              </>
            }
          />
        </div>
      </div>
    </nav>
  )
}
