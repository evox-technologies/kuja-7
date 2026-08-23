'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { LogOut, UserCircle, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { apiFetch, ApiError } from '@/lib/api'
import { defaultAvatarSrc } from '@/lib/avatar'
import { useI18n } from '@/lib/i18n/use-i18n'
import NotificationBell from '@/components/dashboard/notification-bell'
import NotificationInterests from '@/components/dashboard/notification-interests'

interface ProfileSummary {
  avatarUrl?: string | null
  images: string[]
  gender?: string | null
}

interface UserMenuProps {
  /** Rendered instead of the menu when the API says the visitor isn't signed in. */
  fallback?: ReactNode
  /** Where to land after signing out. */
  signOutRedirect?: string
}

/**
 * Signed-in navbar cluster: interest + message notifications and the avatar
 * dropdown. Shared by the dashboard and public navbars so the two stay in sync.
 */
export default function UserMenu({ fallback = null, signOutRedirect = '/login' }: UserMenuProps) {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [gender, setGender] = useState<string | null>(null)
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Re-fetch avatar whenever the user navigates (catches post-upload nav back from profile)
  useEffect(() => {
    apiFetch<ProfileSummary>('/auth/me')
      .then(p => {
        setAvatar(p.images?.[0] ?? p.avatarUrl ?? null)
        setGender(p.gender ?? null)
        setSignedIn(true)
      })
      .catch((err) => {
        setAvatar(null)
        setGender(null)
        // Only a 401 means signed out — a network blip shouldn't log the user out of the UI.
        setSignedIn(!(err instanceof ApiError && err.status === 401))
      })
  }, [pathname])

  const fallbackAvatar = defaultAvatarSrc(gender)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(signOutRedirect)
  }

  if (signedIn === false) return <>{fallback}</>

  return (
    <>
      <NotificationInterests />

      <NotificationBell />

      {/* Avatar + dropdown */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100 ring-2 ring-gray-200 overflow-hidden cursor-pointer flex items-center justify-center hover:ring-brand-border transition-all"
        >
          {avatar || fallbackAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar ?? fallbackAvatar!} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
            <Link
              href="/dashboard/profile"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <UserCircle className="w-4 h-4" />
              {t('dashboard.myProfile')}
            </Link>
            <hr className="my-1 border-gray-100" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t('dashboard.logout')}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
