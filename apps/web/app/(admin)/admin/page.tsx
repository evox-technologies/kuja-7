'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Client-side redirect rather than next/navigation's server `redirect()`:
 * under `output: 'export'` there is no server to run one.
 */
export default function AdminIndexPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/dashboard')
  }, [router])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <span
        role="status"
        aria-label="Loading"
        className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent"
      />
    </div>
  )
}
