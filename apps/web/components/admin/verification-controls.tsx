'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { FormTextarea } from '@/components/admin/form-fields'
import { adminApi } from '@/lib/admin/api'
import { errorMessage } from '@/lib/api'
import {
  VERIFICATION_LABELS,
  VERIFICATION_ORDER,
  type AdminUserDetail,
  type VerificationStatus,
} from '@/lib/admin/types'
import { cn } from '@/lib/utils'

/**
 * Moves a profile through Pending → Under review → Verified → Rejected.
 *
 * Rejecting demands a reason: the API refuses without one, and the member-facing
 * consequence (they disappear from browse results) deserves an explanation
 * someone can read later.
 */
export function VerificationControls({
  profile,
  onChanged,
}: {
  profile: AdminUserDetail
  onChanged: () => void | Promise<void>
}) {
  const toast = useToast()
  const [busy, setBusy] = useState<VerificationStatus | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState(profile.rejectionReason ?? '')

  async function apply(status: VerificationStatus, rejectionReason?: string) {
    setBusy(status)
    try {
      await adminApi.setVerification(profile.id, status, rejectionReason)
      toast.success(`Marked as ${VERIFICATION_LABELS[status].toLowerCase()}.`)
      setRejecting(false)
      await onChanged()
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update the verification status'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-2">
        {VERIFICATION_ORDER.map((status) => {
          const current = profile.verificationStatus === status
          return (
            <button
              key={status}
              type="button"
              disabled={current || busy !== null}
              onClick={() => (status === 'REJECTED' ? setRejecting(true) : void apply(status))}
              className={cn(
                'flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors',
                current
                  ? 'border-brand bg-brand-light font-semibold text-brand-text'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50'
              )}
            >
              {VERIFICATION_LABELS[status]}
              {current && <span className="text-[10px] uppercase tracking-wide">Current</span>}
            </button>
          )
        })}
      </div>

      {rejecting && (
        <div className="mt-3 rounded-xl border border-danger-border bg-danger-bg p-3">
          <FormTextarea
            label="Reason for rejection"
            value={reason}
            onChange={setReason}
            rows={3}
            required
            placeholder="What needs fixing before this profile can be approved?"
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg"
              onClick={() => setRejecting(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-lg"
              loading={busy === 'REJECTED'}
              disabled={!reason.trim()}
              onClick={() => void apply('REJECTED', reason.trim())}
            >
              Reject profile
            </Button>
          </div>
        </div>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
        Only verified profiles appear in member search results. Moving a profile out of Verified
        hides it from browse immediately.
      </p>
    </div>
  )
}
