'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Heart, Users, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { label: 'Home',             href: '/dashboard/home',      icon: Home },
  { label: 'Interests',        href: '/dashboard/interests',  icon: Heart },
  { label: 'Mutual Interests', href: '/dashboard/mutual',     icon: Users },
  { label: 'Chat',             href: '/dashboard/chat',       icon: MessageCircle },
]

export default function DashboardTabs() {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname.startsWith(href)
  }

  return (
    <div className="bg-white border-b border-gray-100 shrink-0 overflow-x-auto">
      <div className="px-2 sm:px-6 flex items-center gap-0 sm:gap-1 min-w-max sm:min-w-0">
        {TABS.map(({ label, href, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                active
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
              )}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">{label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
