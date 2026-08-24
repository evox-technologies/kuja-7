'use client'

import { usePathname } from 'next/navigation'
import { AdminAuthProvider } from '@/contexts/admin-auth'
import { ToastProvider } from '@/components/ui/toast'
import AdminShell from '@/components/admin/shell'

/**
 * data-scale-zone="admin" opts the portal out of the global 1280px zoom-to-fit
 * below `lg` (styles/components/admin.css) — without it every table renders as
 * shrunken, unreadable type instead of scrolling.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // The login screen is the one admin route that must render for someone with
  // no session at all, so it sits outside the guard.
  const isLogin = pathname?.startsWith('/admin/login')

  return (
    <div
      data-scale-zone="admin"
      className="flex flex-col bg-gray-50"
      style={{ minHeight: '100dvh' }}
    >
      <ToastProvider>
        {isLogin ? (
          children
        ) : (
          <AdminAuthProvider>
            <AdminShell>{children}</AdminShell>
          </AdminAuthProvider>
        )}
      </ToastProvider>
    </div>
  )
}
