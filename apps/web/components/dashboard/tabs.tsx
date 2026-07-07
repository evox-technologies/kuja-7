'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Home, Heart, Users, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProfileGuard } from '@/contexts/profile-guard'

const TABS = [
  { label: 'Home',             href: '/dashboard/home',      icon: Home,          protected: false },
  { label: 'Interests',        href: '/dashboard/interests',  icon: Heart,         protected: true  },
  { label: 'Mutual Interests', href: '/dashboard/mutual',     icon: Users,         protected: true  },
  { label: 'Chat',             href: '/dashboard/chat',       icon: MessageCircle, protected: true  },
]

export default function DashboardTabs() {
  const pathname = usePathname()
  const router = useRouter()
  const { guardAction } = useProfileGuard()

  return (
    <div className="bg-white border-b border-gray-100 shrink-0 overflow-x-auto">
      <div className="px-2 sm:px-6 flex items-center gap-0 sm:gap-1 min-w-max sm:min-w-0">
        {TABS.map(({ label, href, icon: Icon, protected: isProtected }) => {
          const active = pathname.startsWith(href)
          return (
            <button
              key={href}
              onClick={() => {
                if (isProtected) {
                  guardAction(() => router.push(href))
                } else {
                  router.push(href)
                }
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                active
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
              )}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
