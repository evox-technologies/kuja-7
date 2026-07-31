'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Crown, LogOut, UserCircle, User } from 'lucide-react'
import LanguageToggle from '@/components/layout/language-toggle'
import { createClient } from '@/lib/supabase/client'
import { apiFetch, ApiError } from '@/lib/api'
import { defaultAvatarSrc } from '@/lib/avatar'
import NotificationBell from './notification-bell'
import NotificationInterests from './notification-interests'
import Logo from '@/components/layout/logo'
interface ProfileSummary {
  avatarUrl?: string | null
  images: string[]
  gender?: string | null
}

export default function DashboardNavbar() {
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
        const src = p.images?.[0] ?? p.avatarUrl ?? null
        setAvatar(src)
        setGender(p.gender ?? null)
        setSignedIn(true)
      })
      .catch((err) => {
        setAvatar(null)
        setGender(null)
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
    router.push('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-100 shrink-0">
      <div className="px-4 lg:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Link href="/" className="text-lg sm:text-xl font-bold tracking-widest text-gray-900">
         <Logo className="text-2xl" />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle />

          {signedIn === false ? (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-brand transition-colors px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex items-center bg-gradient-to-r from-orange-500 to-pink-600 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full hover:opacity-90 transition-opacity"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <NotificationInterests />

              <NotificationBell />

              {/* Avatar + dropdown */}
              <div ref={ref} className="relative">
                <button
                  onClick={() => setOpen(v => !v)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100 ring-2 ring-gray-200 overflow-hidden cursor-pointer flex items-center justify-center hover:ring-brand/40 transition-all"
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
                      My Profile
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  </div>
                )}
              </div>

              {/* Upgrade */}
              <button className="flex items-center gap-1 sm:gap-1.5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full hover:opacity-90 transition-opacity">
                <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Upgrade</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
