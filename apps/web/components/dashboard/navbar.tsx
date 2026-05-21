'use client'

import Link from 'next/link'
import { Bell, Crown, Users } from 'lucide-react'
import LanguageToggle from '@/components/layout/language-toggle'

export default function DashboardNavbar() {
  return (
    <nav className="bg-white border-b border-gray-100 shrink-0">
      <div className="px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-widest text-gray-900">
          LOGO
        </Link>

        <div className="flex items-center gap-3">
          {/* Online / connections count */}
          <button className="relative p-2 rounded-full hover:bg-gray-50 transition-colors">
            <Users className="w-5 h-5 text-gray-400" />
            <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-gray-200 rounded-full text-[9px] font-semibold flex items-center justify-center text-gray-500">
              0
            </span>
          </button>

          <LanguageToggle />

          <button className="p-2 rounded-full hover:bg-gray-50 transition-colors">
            <Bell className="w-5 h-5 text-gray-400" />
          </button>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-gray-200 ring-2 ring-gray-100 overflow-hidden cursor-pointer" />

          {/* Upgrade */}
          <button className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-opacity">
            <Crown className="w-4 h-4" />
            Upgrade
          </button>
        </div>
      </div>
    </nav>
  )
}
