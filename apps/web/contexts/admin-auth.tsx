'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { apiFetch, ApiError } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'
import { isModuleEnabled } from '@/lib/admin/modules'
import { NAV_ITEMS, type NavItem } from '@/lib/admin/nav'
import type { AdminMe } from '@/lib/admin/types'

interface AdminAuthValue {
  me: AdminMe
  can: (permission?: string) => boolean
  nav: NavItem[]
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null)

type State =
  | { status: 'loading' }
  | { status: 'ready'; me: AdminMe }
  | { status: 'denied'; reason: 'anonymous' | 'forbidden' }

/**
 * A blocking gate, unlike contexts/profile-guard.tsx which only ever nudges.
 * Nothing inside renders until the API has confirmed who is asking, so a
 * moderator never sees an admin screen flash before being redirected.
 *
 * This is convenience, not security. The static export ships every admin route
 * to any browser that asks; the API is what actually refuses.
 */
export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [state, setState] = useState<State>({ status: 'loading' })

  const load = useCallback(async () => {
    try {
      const me = await apiFetch<AdminMe>('/admin/me')
      setState({ status: 'ready', me })
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
        // 401: no session. 404: signed in to Supabase but no profile row —
        // JwtAuthGuard's way of saying "you never finished signing up".
        setState({ status: 'denied', reason: 'anonymous' })
      } else {
        // 403 from RolesGuard: a signed-in member who is not staff.
        setState({ status: 'denied', reason: 'forbidden' })
      }
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (state.status !== 'denied') return
    if (state.reason === 'anonymous') {
      const next = encodeURIComponent(pathname)
      router.replace(`/admin/login?next=${next}`)
    } else {
      router.replace('/admin/login?error=forbidden')
    }
  }, [state, pathname, router])

  const signOut = useCallback(async () => {
    await createClient().auth.signOut()
    router.replace('/admin/login')
  }, [router])

  const value = useMemo<AdminAuthValue | null>(() => {
    if (state.status !== 'ready') return null

    const held = new Set(state.me.permissions)
    const can = (permission?: string) => (permission ? held.has(permission) : true)

    return {
      me: state.me,
      can,
      // Both conditions, per the requirements: the module is switched on for
      // this deployment *and* this person holds the permission behind it.
      nav: NAV_ITEMS.filter((item) => isModuleEnabled(item.module) && can(item.permission)),
      signOut,
      refresh: load,
    }
  }, [state, signOut, load])

  if (!value) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-gray-50">
        <span
          role="status"
          aria-label="Loading"
          className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent"
        />
      </div>
    )
  }

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth(): AdminAuthValue {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used inside an AdminAuthProvider')
  return ctx
}
