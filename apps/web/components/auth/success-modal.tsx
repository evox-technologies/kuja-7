'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/use-i18n'

export default function SuccessModal() {
  const { t } = useI18n()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 }}
        className="bg-white rounded-3xl px-8 py-10 max-w-sm w-full text-center shadow-2xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
          className="flex justify-center mb-5"
        >
          <BadgeCheck className="w-16 h-16 text-emerald-500" />
        </motion.div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('auth.successModal.title')}</h2>
        <p className="text-sm text-gray-400 mb-8">
          {t('auth.successModal.subtitle')}
        </p>
        <Button variant="gradient" className="w-full rounded-full mb-3" size="lg" asChild>
          <Link href="/onboarding">{t('auth.successModal.completeProfile')} →</Link>
        </Button>
        <Button variant="outline" className="w-full rounded-full" size="lg" asChild>
          <Link href="/">{t('auth.successModal.skip')}</Link>
        </Button>
      </motion.div>
    </motion.div>
  )
}
