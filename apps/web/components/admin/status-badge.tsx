import { Badge } from '@/components/ui/badge'
import {
  VERIFICATION_LABELS,
  ROLE_LABELS,
  type Role,
  type VerificationStatus,
} from '@/lib/admin/types'

const VERIFICATION_TONE: Record<
  VerificationStatus,
  'success' | 'warning' | 'info' | 'danger'
> = {
  VERIFIED: 'success',
  PENDING: 'warning',
  UNDER_REVIEW: 'info',
  REJECTED: 'danger',
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  return <Badge tone={VERIFICATION_TONE[status]}>{VERIFICATION_LABELS[status]}</Badge>
}

const ROLE_TONE: Record<Role, 'neutral' | 'brand' | 'info'> = {
  USER: 'neutral',
  MODERATOR: 'info',
  ADMIN: 'brand',
  SUPER_ADMIN: 'brand',
}

export function RoleBadge({ role }: { role: Role }) {
  if (role === 'USER') return null
  return <Badge tone={ROLE_TONE[role]}>{ROLE_LABELS[role]}</Badge>
}

export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge tone={isActive ? 'neutral' : 'danger'}>{isActive ? 'Active' : 'Deactivated'}</Badge>
  )
}

/** Sample profiles behave differently, so they are always labelled as such. */
export function SampleBadge() {
  return <Badge tone="brand">Sample</Badge>
}
