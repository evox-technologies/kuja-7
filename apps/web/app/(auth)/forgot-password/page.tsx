'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { useCooldown, rateLimitSeconds } from '@/lib/auth/password'
import { useI18n } from '@/lib/i18n/use-i18n'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const cooldown = useCooldown()

  async function send() {
    if (!email || cooldown.remaining > 0) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password/`,
    })
    setLoading(false)
    // Rate limits are the one error worth showing — otherwise stay generic
    // so we don't leak which emails have accounts.
    const wait = rateLimitSeconds(error)
    if (wait != null) {
      cooldown.start(wait)
      setError(t('auth.rateLimit.wait').replace('{s}', String(wait)))
      return
    }
    if (error) console.error('[forgot-password]', error.message)
    cooldown.start(60)
    setSent(true)
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="bg-white rounded-3xl shadow-xl px-8 py-10 animate-fade-up">
        {sent ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('auth.forgotPassword.sentTitle')}</h1>
            <p className="text-sm text-gray-400 mb-6">
              {t('auth.forgotPassword.sentSubtitle').replace('{email}', email)}
            </p>
            <Link
              href="/login"
              className="block text-center text-sm text-brand-text font-semibold hover:text-brand hover:underline mt-2"
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
              disabled={loading || !email || cooldown.remaining > 0}
            >
              {cooldown.remaining > 0
                ? t('auth.rateLimit.resendIn').replace('{s}', String(cooldown.remaining))
                : loading ? t('auth.forgotPassword.sending') : t('auth.forgotPassword.send')}
            </Button>

            <p className="text-center text-xs text-gray-400 mt-5">
              <Link href="/login" className="text-brand-text font-semibold hover:text-brand hover:underline">
                {t('auth.forgotPassword.backToLogin')}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
