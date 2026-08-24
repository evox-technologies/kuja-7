'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { LoadingPanel } from '@/components/ui/spinner'
import { AdminPage, PageHeader } from '@/components/admin/page-header'
import { UserForm, draftFromProfile, type UserDraft } from '@/components/admin/user-form'
import { adminApi } from '@/lib/admin/api'
import { errorMessage } from '@/lib/api'
import type { AdminUserDetail } from '@/lib/admin/types'

function EditUserInner() {
  // Query param rather than a [id] segment: the static export cannot
  // pre-render a route for every user id.
  const id = useSearchParams().get('id')
  const [profile, setProfile] = useState<AdminUserDetail | null>(null)
  const [draft, setDraft] = useState<UserDraft | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) {
      setError('No user was specified.')
      return
    }
    adminApi
      .getUser(id)
      .then((p) => {
        setProfile(p)
        setDraft(draftFromProfile(p))
      })
      .catch((err) => setError(errorMessage(err, 'Could not load this profile')))
  }, [id])

  if (error) {
    return (
      <AdminPage>
        <p className="text-sm text-danger">{error}</p>
      </AdminPage>
    )
  }

  if (!draft || !profile) return <LoadingPanel />

  return (
    <AdminPage>
      <PageHeader
        title={`Edit ${profile.firstName} ${profile.lastName}`}
        description={profile.email}
      />
      <UserForm mode="edit" initial={draft} userId={profile.id} />
    </AdminPage>
  )
}

export default function EditUserPage() {
  return (
    <Suspense fallback={<LoadingPanel />}>
      <EditUserInner />
    </Suspense>
  )
}
