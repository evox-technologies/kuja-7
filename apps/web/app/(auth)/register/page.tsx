'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import OtpInput from '@/components/auth/otp-input'
import SuccessModal from '@/components/auth/success-modal'
import GoogleButton from '@/components/auth/google-button'
import PasswordStrength from '@/components/auth/password-strength'
import { createClient } from '@/lib/supabase/client'
import { useCooldown, rateLimitSeconds } from '@/lib/auth/password'
import { useI18n } from '@/lib/i18n/use-i18n'

type Step = 'email' | 'otp' | 'password' | 'done'

export default function RegisterPage() {
  const supabase = createClient()
  const { t } = useI18n()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const cooldown = useCooldown()

  async function sendOtp(resend = false) {
    if (!email || cooldown.remaining > 0) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    setLoading(false)
    if (error) {
      const wait = rateLimitSeconds(error)
      if (wait != null) {
        cooldown.start(wait)
        setError(t('auth.rateLimit.wait').replace('{s}', String(wait)))
      } else {
        setError(error.message)
      }
      return
    }
    cooldown.start(60)
    if (!resend) setStep('otp')
  }

  async function verifyOtp() {
    const token = otp.join('')
    if (token.length < 6) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    setLoading(false)
    if (error) { setError(error.message); return }
    setStep('password')
  }

  async function finish() {
    if (password.length < 8) { setError(t('auth.register.passwordMin')); return }
    if (password !== confirm) { setError(t('auth.register.passwordMismatch')); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setStep('done')
  }

  return (
    <>
      {step === 'done' && <SuccessModal />}

      <div className="mx-auto max-w-md">
          {step === 'email' && (
            <div className="bg-white rounded-3xl shadow-xl px-8 py-10 animate-slide-in">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('auth.register.title')}</h1>
              <p className="text-sm text-gray-400 mb-6">{t('auth.register.subtitle')}</p>
              <hr className="mb-6 border-gray-100" />

              <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">
                {t('auth.register.continueWithEmail')}
              </label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendOtp()}
                className="rounded-xl mb-4"
                autoFocus
              />
              {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
              <Button
                variant="gradient"
                className="w-full rounded-full"
                size="lg"
                onClick={() => sendOtp()}
                disabled={loading || !email || cooldown.remaining > 0}
              >
                {cooldown.remaining > 0
                  ? t('auth.rateLimit.resendIn').replace('{s}', String(cooldown.remaining))
                  : loading ? t('auth.register.sending') : t('auth.register.continue')}
              </Button>
              <div className="flex items-center gap-3 my-5">
                <hr className="flex-1 border-gray-100" />
                <span className="text-xs text-gray-300">{t('auth.register.or')}</span>
                <hr className="flex-1 border-gray-100" />
              </div>

              <GoogleButton label={t('auth.register.continueWithGoogle')} />

              <p className="text-center text-xs text-gray-400 mt-5">
                {t('auth.register.alreadyHaveAccount')}{' '}
                <Link href="/login" className="text-brand-text font-semibold hover:text-brand hover:underline">
                  {t('auth.register.signIn')}
                </Link>
              </p>
            </div>
          )}

          {step === 'otp' && (
            <div className="bg-white rounded-3xl shadow-xl px-8 py-10 animate-slide-in">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('auth.register.verifyEmailTitle')}</h1>
              <p className="text-sm text-gray-400 mb-6">
                {t('auth.register.verifyEmailSubtitlePrefix')}{' '}
                <span className="text-brand-text font-semibold">{email}</span>
              </p>
              <hr className="mb-8 border-gray-100" />

              <OtpInput value={otp} onChange={setOtp} disabled={loading} />
              {error && <p className="text-xs text-red-500 mt-4 text-center">{error}</p>}
              <Button
                variant="gradient"
                className="w-full rounded-full mt-8"
                size="lg"
                onClick={verifyOtp}
                disabled={loading || otp.join('').length < 6}
              >
                {loading ? t('auth.register.verifying') : t('auth.register.verify')}
              </Button>
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => { setStep('email'); setOtp(Array(6).fill('')); setError('') }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← {t('auth.register.changeEmail')}
                </button>
                <button
                  onClick={() => sendOtp(true)}
                  disabled={loading || cooldown.remaining > 0}
                  className="text-xs text-brand-text font-semibold hover:text-brand hover:underline disabled:text-gray-300 disabled:no-underline transition-colors"
                >
                  {cooldown.remaining > 0
                    ? t('auth.rateLimit.resendIn').replace('{s}', String(cooldown.remaining))
                    : t('auth.register.resend')}
                </button>
              </div>
            </div>
          )}

          {step === 'password' && (
            <div className="bg-white rounded-3xl shadow-xl px-8 py-10 animate-slide-in">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('auth.register.setPasswordTitle')}</h1>
              <p className="text-sm text-gray-400 mb-6">{t('auth.register.setPasswordSubtitle')}</p>
              <hr className="mb-6 border-gray-100" />

              <div className="relative mb-4">
                <Input
                  type={showPass ? 'text' : 'password'}
                  placeholder={t('auth.login.password')}
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

              <PasswordStrength value={password} />

              <div className="relative mb-4">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder={t('auth.register.confirmPasswordPlaceholder')}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && finish()}
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
                onClick={finish}
                disabled={loading || !password || !confirm}
              >
                {loading ? t('auth.register.creating') : t('auth.register.title')}
              </Button>
            </div>
          )}
      </div>
    </>
  )
}
