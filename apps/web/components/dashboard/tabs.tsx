'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Heart, Users, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/use-i18n'
import { isProfileComplete } from '@/lib/hooks/use-register-user'
import OnboardingPromptModal from '@/components/dashboard/onboarding-prompt-modal'

const TAB_CONFIG = [
  { key: 'home' as const, href: '/dashboard/home', icon: Home, gated: false },
  { key: 'interests' as const, href: '/dashboard/interests', icon: Heart, gated: true },
  { key: 'mutual' as const, href: '/dashboard/mutual', icon: Users, gated: true },
  { key: 'chat' as const, href: '/dashboard', icon: MessageCircle, gated: true },
]

export default function DashboardTabs() {
  const pathname = usePathname()
  const router = useRouter()
  const { messages } = useI18n()
  const [promptOpen, setPromptOpen] = useState(false)

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  function handleTabClick(e: React.MouseEvent, gated: boolean) {
    if (!gated || isProfileComplete()) return
    e.preventDefault()
    setPromptOpen(true)
  }

  function renderTab({ key, href, icon: Icon, gated }: (typeof TAB_CONFIG)[number]) {
    const active = isActive(href)
    return (
      <Link
        key={href}
        href={href}
        onClick={(e) => handleTabClick(e, gated)}
        className={cn(
          'flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
          active
            ? 'border-brand text-brand'
            : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200',
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {messages.dashboard.tabs[key]}
      </Link>
    )
  }

  function renderMobileTab({ key, href, icon: Icon, gated }: (typeof TAB_CONFIG)[number]) {
    const active = isActive(href)
    return (
      <Link
        key={href}
        href={href}
        onClick={(e) => handleTabClick(e, gated)}
        className={cn(
          'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] font-medium transition-colors',
          active ? 'text-brand' : 'text-gray-400',
        )}
      >
        <Icon className="w-5 h-5" />
        <span className="truncate max-w-full px-1">{messages.dashboard.tabs[key]}</span>
      </Link>
    )
  }

  return (
    <>
      <div className="bg-white border-b border-gray-100 shrink-0 hidden md:block">
        <div className="px-4 sm:px-6 flex items-center gap-1 overflow-x-auto">
          {TAB_CONFIG.map(renderTab)}
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 safe-area-pb">
        <div className="flex items-stretch justify-around">
          {TAB_CONFIG.map(renderMobileTab)}
        </div>
      </div>

      <OnboardingPromptModal
        open={promptOpen}
        onConfirm={() => {
          setPromptOpen(false)
          router.push('/onboarding')
        }}
        onCancel={() => setPromptOpen(false)}
      />
    </>
  )
}
