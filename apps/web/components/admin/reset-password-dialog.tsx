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
import { FormField } from '@/components/admin/form-fields'
import { adminApi } from '@/lib/admin/api'
import { errorMessage } from '@/lib/api'
import type { Moderator } from '@/lib/admin/types'

export function ResetPasswordDialog({
  moderator,
  onClose,
  onDone,
}: {
  moderator: Moderator | null
  onClose: () => void
  onDone: () => void
}) {
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!moderator) return
    if (password.length < 8) {
      setError('The password must be at least 8 characters.')
      return
    }

    setBusy(true)
    setError('')
    try {
      await adminApi.resetModeratorPassword(moderator.id, password)
      toast.success(`Password reset for ${moderator.firstName} ${moderator.lastName}.`)
      setPassword('')
      onDone()
    } catch (err) {
      setError(errorMessage(err, 'Could not reset the password'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={!!moderator} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Reset password for {moderator?.firstName} {moderator?.lastName}
          </DialogTitle>
          <DialogDescription>
            Sets a new password immediately. They are not emailed about it, so tell them what it
            is.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="mb-3 rounded-xl border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}

        <FormField
          label="New password"
          value={password}
          onChange={setPassword}
          required
          hint="At least 8 characters."
        />

        <DialogFooter>
          <Button variant="ghost" className="rounded-xl" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button className="rounded-xl" loading={busy} onClick={() => void submit()}>
            Reset password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
