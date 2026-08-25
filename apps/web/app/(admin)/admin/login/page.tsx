'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import Logo from '@/components/layout/logo'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { apiFetch, ApiError, errorMessage } from '@/lib/api'
import { isStaff, type AdminMe } from '@/lib/admin/types'

const inputCls =
  'w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-border focus:border-brand transition-colors'

function AdminLoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  const next = safeNext(searchParams.get('next'))

  // Sessions are shared with the member site (one Supabase client per tab), so
  // someone already signed in as staff should not be asked to type it again.
  useEffect(() => {
    let active = true
    apiFetch<AdminMe>('/admin/me')
      .then((me) => {
        if (!active) return
        if (isStaff(me.role)) router.replace(next)
        else setChecking(false)
      })
      .catch(() => active && setChecking(false))
    return () => {
      active = false
    }
  }, [router, next])

  useEffect(() => {
    if (searchParams.get('error') === 'forbidden') {
      setError('That account does not have access to the admin portal.')
    }
  }, [searchParams])

  async function signIn(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setLoading(false)
      setError(authError.message)
      return
    }

    // Signing in proves who they are, not that they belong here. Ask the API
    // before letting them through, and drop the session again if they don't —
    // otherwise a member is left silently signed in on the staff URL.
    try {
      const me = await apiFetch<AdminMe>('/admin/me')
      if (!isStaff(me.role)) throw new Error('not staff')
      router.replace(next)
    } catch (err) {
      await supabase.auth.signOut()
      setLoading(false)
      setError(
        err instanceof ApiError && err.status === 403
          ? 'That account does not have access to the admin portal.'
          : err instanceof Error && err.message === 'not staff'
            ? 'That account does not have access to the admin portal.'
            : errorMessage(err, 'Could not verify your account. Try again.')
      )
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <span
          role="status"
          aria-label="Loading"
          className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent"
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Logo className="text-2xl text-gray-900" />
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Staff portal
          </p>
        </div>

        <form
          onSubmit={signIn}
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <h1 className="text-base font-bold text-gray-900">Sign in</h1>
          <p className="mt-1 text-sm text-gray-500">
            For admins and moderators. Members should use the main site.
          </p>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <label className="mt-4 block">
            <span className="mb-1 block text-[10px] uppercase tracking-wide text-gray-400">
              Email
            </span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              required
            />
          </label>

          <label className="mt-3 block">
            <span className="mb-1 block text-[10px] uppercase tracking-wide text-gray-400">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              required
            />
          </label>

          <Button type="submit" loading={loading} className="mt-5 w-full rounded-xl">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  )
}

/** Same open-redirect guard the member login uses. */
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/admin/dashboard'
}

// useSearchParams needs a Suspense boundary or the static export build fails.
export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      }
    >
      <AdminLoginInner />
    </Suspense>
  )
}
