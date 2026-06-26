'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/use-i18n'

function CallbackHandler() {
  const router = useRouter()
  const { t } = useI18n()
  const handledRef = useRef(false)

  useEffect(() => {
    if (handledRef.current) return
    handledRef.current = true

    const supabase = createClient()

    // supabase-js with detectSessionInUrl:true auto-exchanges the ?code= PKCE
    // param during client initialisation. getSession() awaits that initialisation,
    // so by the time it resolves the session is already set (or the exchange failed).
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error('[auth/callback]', error.message)

      if (session) {
        router.replace('/dashboard')
      } else {
        router.replace('/login?error=oauth_failed')
      }
    })
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      <p className="text-sm text-gray-400">{t('auth.callback.completing')}</p>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  )
}
