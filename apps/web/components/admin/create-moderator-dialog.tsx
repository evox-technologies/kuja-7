'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { FieldGrid, FormDate, FormField, FormSelect } from '@/components/admin/form-fields'
import { useAdminAuth } from '@/contexts/admin-auth'
import { adminApi } from '@/lib/admin/api'
import { errorMessage } from '@/lib/api'
import { MIN_AGE } from '@/lib/options'
import { ROLE_LABELS, type Role } from '@/lib/admin/types'

/**
 * Unlike a sample profile, a moderator does get a real Supabase auth user —
 * they have to be able to sign in. The API creates it with the service-role key
 * and confirms the address, so no invitation email is sent; the password is
 * handed over out of band.
 */
export function CreateModeratorDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const toast = useToast()
  const { me } = useAdminAuth()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    gender: 'FEMALE',
    dateOfBirth: '',
    role: 'MODERATOR' as Role,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Only a super admin may mint admin-level accounts; the API enforces the same.
  const grantableRoles: Role[] =
    me.role === 'SUPER_ADMIN' ? ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'] : ['MODERATOR']

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit() {
    if (!form.firstName || !form.lastName || !form.email || !form.dateOfBirth) {
      setError('Fill in every field marked with an asterisk.')
      return
    }
    if (form.password.length < 8) {
      setError('The temporary password must be at least 8 characters.')
      return
    }

    setBusy(true)
    setError('')
    try {
      await adminApi.createModerator({ ...form })
      toast.success(`${form.firstName} ${form.lastName} can now sign in.`)
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        gender: 'FEMALE',
        dateOfBirth: '',
        role: 'MODERATOR',
      })
      onCreated()
    } catch (err) {
      setError(errorMessage(err, 'Could not create this account'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a moderator</DialogTitle>
          <DialogDescription>
            Creates a sign-in account straight away — no confirmation email is sent, so pass the
            temporary password on yourself.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="mb-3 rounded-xl border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}

        <FieldGrid>
          <FormField label="First name" value={form.firstName} onChange={(v) => set('firstName', v)} required />
          <FormField label="Last name" value={form.lastName} onChange={(v) => set('lastName', v)} required />
          <FormField label="Email" type="email" value={form.email} onChange={(v) => set('email', v)} required />
          <FormField
            label="Temporary password"
            type="text"
            value={form.password}
            onChange={(v) => set('password', v)}
            required
            hint="At least 8 characters. They can change it later."
          />
          <FormSelect label="Gender" value={form.gender} onChange={(v) => set('gender', v)} options={['MALE', 'FEMALE']} required />
          <FormDate
            label="Date of birth"
            value={form.dateOfBirth}
            onChange={(v) => set('dateOfBirth', v)}
            required
            max={maxAdultBirthDate()}
          />
          <FormSelect
            label="Role"
            value={form.role}
            onChange={(v) => set('role', v)}
            options={grantableRoles}
            required
            placeholder="Moderator"
          />
        </FieldGrid>

        <p className="mt-2 text-[11px] text-gray-400">
          {ROLE_LABELS.MODERATOR}s can add, edit and verify profiles. What each role may do is set
          on the Roles &amp; Permissions screen.
        </p>

        <DialogFooter>
          <Button variant="ghost" className="rounded-xl" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button className="rounded-xl" loading={busy} onClick={() => void submit()}>
            Create account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function maxAdultBirthDate(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - MIN_AGE)
  return d.toISOString().slice(0, 10)
}
