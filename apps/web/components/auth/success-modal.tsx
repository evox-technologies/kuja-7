'use client'

import Link from 'next/link'
import { BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/use-i18n'

export default function SuccessModal() {
  const { t } = useI18n()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-fade-in">
      <div className="bg-white rounded-3xl px-8 py-10 max-w-sm w-full text-center shadow-2xl animate-scale-in">
        <div className="flex justify-center mb-5 animate-pop">
          <BadgeCheck className="w-16 h-16 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('auth.successModal.title')}</h2>
        <p className="text-sm text-gray-400 mb-8">
          {t('auth.successModal.subtitle')}
        </p>
        <Button variant="gradient" className="w-full rounded-full mb-3" size="lg" asChild>
          <Link href="/profile/setup">{t('auth.successModal.completeProfile')} →</Link>
        </Button>
        <Button variant="outline" className="w-full rounded-full" size="lg" asChild>
          <Link href="/">{t('auth.successModal.skip')}</Link>
        </Button>
      </div>
    </div>
  )
}
