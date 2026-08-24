'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Menu, X } from 'lucide-react'
import Logo from '@/components/layout/logo'
import { useAdminAuth } from '@/contexts/admin-auth'
import { ROLE_LABELS } from '@/lib/admin/types'
import { cn } from '@/lib/utils'

/**
 * Sidebar on desktop, slide-down drawer on mobile. Only renders inside
 * AdminAuthProvider, so `me` and `nav` are already resolved.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { me, nav, signOut } = useAdminAuth()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-[100dvh] w-full">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-gray-100 bg-white">
        <div className="flex h-16 items-center px-5">
          <Link href="/admin/dashboard" className="transition-opacity hover:opacity-80">
            <Logo className="text-xl text-gray-900" />
          </Link>
        </div>
        <NavList items={nav} pathname={pathname} />
        <AccountFooter
          name={`${me.firstName} ${me.lastName}`}
          role={ROLE_LABELS[me.role]}
          onSignOut={signOut}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-100 bg-white px-4">
          <Link href="/admin/dashboard">
            <Logo className="text-lg text-gray-900" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="grid h-9 w-9 place-items-center rounded-full text-gray-600 transition-colors hover:bg-gray-100"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {open && (
          <div className="lg:hidden border-b border-gray-100 bg-white">
            <NavList items={nav} pathname={pathname} onNavigate={() => setOpen(false)} />
            <AccountFooter
              name={`${me.firstName} ${me.lastName}`}
              role={ROLE_LABELS[me.role]}
              onSignOut={signOut}
            />
          </div>
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}

function NavList({
  items,
  pathname,
  onNavigate,
}: {
  items: ReturnType<typeof useAdminAuth>['nav']
  pathname: string | null
  onNavigate?: () => void
}) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-2">
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active = isActive(pathname, item.href)
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors',
                  item.child && 'ml-4 text-[13px]',
                  active
                    ? 'bg-brand-light font-semibold text-brand-text'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function AccountFooter({
  name,
  role,
  onSignOut,
}: {
  name: string
  role: string
  onSignOut: () => void
}) {
  return (
    <div className="border-t border-gray-100 p-3">
      <div className="px-2 py-1.5">
        <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
        <p className="text-xs text-gray-400">{role}</p>
      </div>
      <button
        type="button"
        onClick={onSignOut}
        className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  )
}

/**
 * `/admin/users` must not light up while on `/admin/users/new` — that entry has
 * its own row — so a prefix match only counts when the next character is a
 * boundary and no longer path exists in the list.
 */
function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false
  const clean = pathname.replace(/\/$/, '')
  return clean === href
}
