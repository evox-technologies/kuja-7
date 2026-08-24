'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Eye, EyeOff } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PasswordStrength from '@/components/auth/password-strength'
import { createClient } from '@/lib/supabase/client'
import { rateLimitSeconds } from '@/lib/auth/password'
import { useI18n } from '@/lib/i18n/use-i18n'

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** 'checking' until we know whether the account signs in with a password at all. */
type Mode = 'checking' | 'change' | 'create'

/**
 * Self-service password change for signed-in members. Supabase's updateUser
 * doesn't ask for the old password, so we re-authenticate with
 * signInWithPassword first — otherwise anyone who walks up to an unlocked
 * browser could take the account over.
 *
 * Google-only accounts have no password to re-authenticate against, so they get
 * the 'create' mode instead, which just sets one.
 */
export default function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const supabase = createClient()
  const { t } = useI18n()
  const [mode, setMode] = useState<Mode>('checking')
  const [email, setEmail] = useState('')
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // Reset every time the dialog is opened so a half-typed attempt never leaks
  // into the next one.
  useEffect(() => {
    if (!open) return
    setMode('checking')
    setCurrent('')
    setPassword('')
    setConfirm('')
    setShowCurrent(false)
    setShowPass(false)
    setShowConfirm(false)
    setError('')
    setDone(false)

    let cancelled = false
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled) return
      setEmail(user?.email ?? '')
      const hasPassword = user?.identities?.some(i => i.provider === 'email') ?? false
      setMode(hasPassword ? 'change' : 'create')
    })
    return () => { cancelled = true }
  }, [open, supabase])

  async function save() {
    if (mode === 'change' && !current) {
      setError(t('auth.changePassword.currentRequired'))
      return
    }
    if (password.length < 8) {
      setError(t('auth.register.passwordMin'))
      return
    }
    if (password !== confirm) {
      setError(t('auth.register.passwordMismatch'))
      return
    }
    if (mode === 'change' && current === password) {
      setError(t('auth.changePassword.sameAsCurrent'))
      return
    }

    setSaving(true)
    setError('')

    if (mode === 'change') {
      // Re-authentication doubles as the "is this really you" check. It returns
      // a fresh session for the same user, so the caller stays signed in.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      })
      if (signInError) {
        setSaving(false)
        const wait = rateLimitSeconds(signInError)
        setError(wait ? t('auth.rateLimit.wait').replace('{s}', String(wait)) : t('auth.changePassword.currentWrong'))
        return
      }
    }

    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setDone(true)
  }

  const submitDisabled =
    saving || !password || !confirm || (mode === 'change' && !current)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {done ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                {t('auth.changePassword.doneTitle')}
              </DialogTitle>
              <DialogDescription>{t('auth.changePassword.doneSubtitle')}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button className="rounded-full" onClick={() => onOpenChange(false)}>
                {t('auth.changePassword.close')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {mode === 'create'
                  ? t('auth.changePassword.createTitle')
                  : t('auth.changePassword.title')}
              </DialogTitle>
              <DialogDescription>
                {mode === 'create'
                  ? t('auth.changePassword.createSubtitle')
                  : t('auth.changePassword.subtitle')}
              </DialogDescription>
            </DialogHeader>

            {mode === 'checking' ? (
              <div className="flex justify-center py-8">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              </div>
            ) : (
              <>
                {mode === 'change' && (
                  <div className="relative mb-4">
                    <Input
                      type={showCurrent ? 'text' : 'password'}
                      placeholder={t('auth.changePassword.currentPassword')}
                      value={current}
                      onChange={e => setCurrent(e.target.value)}
                      autoComplete="current-password"
                      className="rounded-xl pr-11"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={t('auth.changePassword.toggleVisibility')}
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                )}

                <div className="relative mb-4">
                  <Input
                    type={showPass ? 'text' : 'password'}
                    placeholder={t('auth.changePassword.newPassword')}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="rounded-xl pr-11"
                    autoFocus={mode === 'create'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={t('auth.changePassword.toggleVisibility')}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <PasswordStrength value={password} />

                <div className="relative mb-4">
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder={t('auth.changePassword.confirmPlaceholder')}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !submitDisabled) void save() }}
                    autoComplete="new-password"
                    className="rounded-xl pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={t('auth.changePassword.toggleVisibility')}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {error && (
                  <p className="mb-1 rounded-xl border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger">
                    {error}
                  </p>
                )}

                <DialogFooter>
                  <Button
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => onOpenChange(false)}
                    disabled={saving}
                  >
                    {t('auth.changePassword.cancel')}
                  </Button>
                  <Button
                    variant="gradient"
                    className="rounded-full"
                    loading={saving}
                    disabled={submitDisabled}
                    onClick={() => void save()}
                  >
                    {mode === 'create'
                      ? t('auth.changePassword.createSave')
                      : t('auth.changePassword.save')}
                  </Button>
                </DialogFooter>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
