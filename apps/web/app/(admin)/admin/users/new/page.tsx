'use client'

import { AdminPage, PageHeader } from '@/components/admin/page-header'
import { UserForm, emptyDraft } from '@/components/admin/user-form'

export default function NewUserPage() {
  return (
    <AdminPage>
      <PageHeader
        title="Add user"
        description="Create a profile by hand — typically a sample profile to populate the site before launch."
      />
      <UserForm mode="create" initial={emptyDraft()} />
    </AdminPage>
  )
}
