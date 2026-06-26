'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/use-i18n'

type Phase = 'verifying' | 'invalid' | 'form' | 'done'

function ResetHandler() {
  const supabase = createClient()
  const { t } = useI18n()
  const [phase, setPhase] = useState<Phase>('verifying')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // detectSessionInUrl auto-exchanges the recovery ?code= during client init.
    // getSession awaits that, so a session here means the link was valid.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setPhase(session ? 'form' : 'invalid')
    })
  }, [supabase])

  async function save() {
    if (password.length < 8) { setError(t('auth.register.passwordMin')); return }
    if (password !== confirm) { setError(t('auth.register.passwordMismatch')); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    await supabase.auth.signOut()
    setPhase('done')
  }

  return (
    <div className="mx-auto max-w-md">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="bg-white rounded-3xl shadow-xl px-8 py-10"
      >
        {phase === 'verifying' && (
          <div className="flex flex-col items-center justify-center gap-3 py-6">
            <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
            <p className="text-sm text-gray-400">{t('auth.resetPassword.verifying')}</p>
          </div>
        )}

        {phase === 'invalid' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('auth.resetPassword.title')}</h1>
            <p className="text-sm text-red-500 mb-6">{t('auth.resetPassword.invalidLink')}</p>
            <Button variant="gradient" className="w-full rounded-full" size="lg" asChild>
              <Link href="/forgot-password">{t('auth.login.forgotPassword')}</Link>
            </Button>
          </>
        )}

        {phase === 'done' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('auth.resetPassword.doneTitle')}</h1>
            <p className="text-sm text-gray-400 mb-6">{t('auth.resetPassword.doneSubtitle')}</p>
            <Button variant="gradient" className="w-full rounded-full" size="lg" asChild>
              <Link href="/login">{t('auth.resetPassword.goToLogin')}</Link>
            </Button>
          </>
        )}

        {phase === 'form' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('auth.resetPassword.title')}</h1>
            <p className="text-sm text-gray-400 mb-6">{t('auth.resetPassword.subtitle')}</p>
            <hr className="mb-6 border-gray-100" />

            <div className="relative mb-4">
              <Input
                type={showPass ? 'text' : 'password'}
                placeholder={t('auth.resetPassword.newPassword')}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="rounded-xl pr-11"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative mb-4">
              <Input
                type={showConfirm ? 'text' : 'password'}
                placeholder={t('auth.resetPassword.confirmPlaceholder')}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && save()}
                className="rounded-xl pr-11"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
            <Button
              variant="gradient"
              className="w-full rounded-full"
              size="lg"
              onClick={save}
              disabled={loading || !password || !confirm}
            >
              {loading ? t('auth.resetPassword.saving') : t('auth.resetPassword.save')}
            </Button>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetHandler />
    </Suspense>
  )
}
