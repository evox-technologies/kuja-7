'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Heart, Users, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { label: 'Home',             href: '/dashboard/home',     icon: Home },
  { label: 'Interests',        href: '/dashboard/interests', icon: Heart },
  { label: 'Mutual Interests', href: '/dashboard/mutual',    icon: Users },
  { label: 'Chat',             href: '/dashboard',           icon: MessageCircle },
]

export default function DashboardTabs() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <div className="bg-white border-b border-gray-100 shrink-0">
      <div className="px-6 flex items-center gap-1">
        {TABS.map(({ label, href, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors',
                active
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
