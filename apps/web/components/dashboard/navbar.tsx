'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Bell, Crown, LogOut, Users, UserCircle } from 'lucide-react'
import LanguageToggle from '@/components/layout/language-toggle'
import { createClient } from '@/lib/supabase/client'

export default function DashboardNavbar() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

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
      <div className="px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Link href="/" className="text-lg sm:text-xl font-bold tracking-widest text-gray-900">
          LOGO
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <button className="relative p-2 rounded-full hover:bg-gray-50 transition-colors hidden sm:block">
            <Users className="w-5 h-5 text-gray-400" />
            <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-gray-200 rounded-full text-[9px] font-semibold flex items-center justify-center text-gray-500">
              0
            </span>
          </button>

          <LanguageToggle />

          <button className="p-2 rounded-full hover:bg-gray-50 transition-colors">
            <Bell className="w-5 h-5 text-gray-400" />
          </button>

          {/* Avatar + dropdown */}
          <div ref={ref} className="relative">
            <div
              onClick={() => setOpen(v => !v)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-200 ring-2 ring-gray-100 overflow-hidden cursor-pointer"
            />
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
        </div>
      </div>
    </nav>
  )
}
