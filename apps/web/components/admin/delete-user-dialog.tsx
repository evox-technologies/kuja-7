'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
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
import { adminApi } from '@/lib/admin/api'
import { errorMessage } from '@/lib/api'
import type { AdminUserRow } from '@/lib/admin/types'

/**
 * Deleting is not the same as deactivating, and the difference is not obvious
 * from a menu item — so it is spelled out here, with the safer option offered
 * alongside.
 */
export function DeleteUserDialog({
  user,
  onClose,
  onDeleted,
}: {
  user: AdminUserRow | null
  onClose: () => void
  onDeleted: () => void
}) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  async function confirm() {
    if (!user) return
    setBusy(true)
    try {
      await adminApi.deleteUser(user.id)
      toast.success(`${user.firstName} ${user.lastName} deleted.`)
      onDeleted()
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete this account'))
    } finally {
      setBusy(false)
    }
  }

  async function deactivate() {
    if (!user) return
    setBusy(true)
    try {
      await adminApi.setActive(user.id, false)
      toast.success(`${user.firstName} ${user.lastName} deactivated instead.`)
      onDeleted()
    } catch (err) {
      toast.error(errorMessage(err, 'Could not deactivate this account'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-danger" />
            Delete {user?.firstName} {user?.lastName}?
          </DialogTitle>
          <DialogDescription>
            This removes the profile permanently, along with every interest they sent or
            received, their shortlists, contact requests, and any conversation they were part
            of — including the messages the other person sent. It cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-warning-border bg-warning-bg px-3 py-2 text-xs text-warning">
          If you only want to take them off the site, deactivate instead — it hides the profile
          and blocks sign-in while keeping their history intact.
        </div>

        <DialogFooter>
          <Button variant="ghost" className="rounded-xl" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          {user?.isActive && (
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => void deactivate()}
              disabled={busy}
            >
              Deactivate instead
            </Button>
          )}
          <Button
            variant="destructive"
            className="rounded-xl"
            loading={busy}
            onClick={() => void confirm()}
          >
            Delete permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
