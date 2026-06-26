'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/use-i18n'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function send() {
    if (!email) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password/`,
    })
    setLoading(false)
    // ponytail: always show "sent" even on error — don't leak which emails exist
    if (error) console.error('[forgot-password]', error.message)
    setSent(true)
  }

  return (
    <div className="mx-auto max-w-md">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="bg-white rounded-3xl shadow-xl px-8 py-10"
      >
        {sent ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('auth.forgotPassword.sentTitle')}</h1>
            <p className="text-sm text-gray-400 mb-6">
              {t('auth.forgotPassword.sentSubtitle').replace('{email}', email)}
            </p>
            <Link
              href="/login"
              className="block text-center text-sm text-brand font-semibold hover:underline mt-2"
            >
              {t('auth.forgotPassword.backToLogin')}
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('auth.forgotPassword.title')}</h1>
            <p className="text-sm text-gray-400 mb-6">{t('auth.forgotPassword.subtitle')}</p>
            <hr className="mb-6 border-gray-100" />

            <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">
              {t('auth.forgotPassword.email')}
            </label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              className="rounded-xl mb-4"
              autoFocus
            />
            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
            <Button
              variant="gradient"
              className="w-full rounded-full"
              size="lg"
              onClick={send}
              disabled={loading || !email}
            >
              {loading ? t('auth.forgotPassword.sending') : t('auth.forgotPassword.send')}
            </Button>

            <p className="text-center text-xs text-gray-400 mt-5">
              <Link href="/login" className="text-brand font-semibold hover:underline">
                {t('auth.forgotPassword.backToLogin')}
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  )
}
