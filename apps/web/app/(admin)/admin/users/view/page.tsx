'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { History, Pencil, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingPanel } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { AdminPage, PageHeader, Panel } from '@/components/admin/page-header'
import {
  ActiveBadge,
  RoleBadge,
  SampleBadge,
  VerificationBadge,
} from '@/components/admin/status-badge'
import { VerificationControls } from '@/components/admin/verification-controls'
import { useAdminAuth } from '@/contexts/admin-auth'
import { adminApi } from '@/lib/admin/api'
import { errorMessage } from '@/lib/api'
import { defaultAvatarSrc } from '@/lib/avatar'
import type { AdminUserDetail } from '@/lib/admin/types'

function ViewUserInner() {
  const id = useSearchParams().get('id')
  const { can } = useAdminAuth()
  const [profile, setProfile] = useState<AdminUserDetail | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!id) {
      setError('No user was specified.')
      return
    }
    try {
      setProfile(await adminApi.getUser(id))
    } catch (err) {
      setError(errorMessage(err, 'Could not load this profile'))
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  if (error) {
    return (
      <AdminPage>
        <p className="text-sm text-danger">{error}</p>
      </AdminPage>
    )
  }
  if (!profile) return <LoadingPanel />

  const avatar = profile.images?.[0] ?? profile.avatarUrl ?? defaultAvatarSrc(profile.gender)

  return (
    <AdminPage>
      <PageHeader
        title={`${profile.firstName} ${profile.lastName}`}
        description={profile.email}
        actions={
          can('users.edit') && (
            <Button asChild variant="outline" className="rounded-xl">
              <Link href={`/admin/users/edit?id=${profile.id}`}>
                <Pencil className="mr-1.5 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel className="mb-4">
            <div className="flex flex-wrap items-start gap-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-gray-100">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <UserIcon className="h-8 w-8 text-gray-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <VerificationBadge status={profile.verificationStatus} />
                  <ActiveBadge isActive={profile.isActive} />
                  <RoleBadge role={profile.role} />
                  {profile.isDummy && <SampleBadge />}
                  {!profile.profileCompleted && (
                    <span className="text-[11px] text-warning">Profile incomplete</span>
                  )}
                </div>
                {profile.rejectionReason && (
                  <p className="mt-2 rounded-xl border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger">
                    <span className="font-semibold">Rejected:</span> {profile.rejectionReason}
                  </p>
                )}
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
                  <Stat label="Registered" value={formatDate(profile.createdAt)} />
                  <Stat label="Interests sent" value={String(profile.activity.interestsSent)} />
                  <Stat label="Interests received" value={String(profile.activity.interestsReceived)} />
                  <Stat label="Conversations" value={String(profile.activity.conversations)} />
                  {profile.createdBy && (
                    <Stat
                      label="Added by"
                      value={`${profile.createdBy.firstName} ${profile.createdBy.lastName}`}
                    />
                  )}
                  {profile.updatedBy && (
                    <Stat
                      label="Last edited by"
                      value={`${profile.updatedBy.firstName} ${profile.updatedBy.lastName}`}
                    />
                  )}
                </dl>
              </div>
            </div>
          </Panel>

          <Panel title="Profile" className="mb-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              <Field label="Gender" value={profile.gender} />
              <Field label="Date of birth" value={formatDate(profile.dateOfBirth)} />
              <Field label="Height" value={profile.height} />
              <Field label="Nationality" value={profile.nationality} />
              <Field label="Ethnicity" value={profile.ethnicity} />
              <Field label="Caste" value={profile.caste} />
              <Field label="Religion" value={profile.religion} />
              <Field label="Civil status" value={profile.civilStatus} />
              <Field label="Country" value={profile.country} />
              <Field label="City" value={profile.city} />
              <Field label="District" value={profile.stateDistrict} />
              <Field label="Education" value={profile.educationLevel} />
              <Field label="Profession" value={profile.profession} />
              <Field label="Drinking" value={profile.drinking} />
              <Field label="Smoking" value={profile.smoking} />
              <Field label="Food preference" value={profile.foodPreference} />
              <Field label="Kuja number" value={profile.kujaNumber} />
              <Field label="Birth day" value={profile.birthDay} />
            </dl>
            {profile.bio && (
              <div className="mt-4">
                <p className="mb-1 text-[10px] uppercase tracking-wide text-gray-400">About</p>
                <p className="whitespace-pre-line text-sm text-gray-700">{profile.bio}</p>
              </div>
            )}
          </Panel>

          <Panel
            title="Contact details"
            description="Private to mutual matches. Shown here because staff need them for support."
          >
            <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              <Field label="Mobile" value={profile.mobileNumber} />
              <Field label="WhatsApp" value={profile.whatsappNumber} />
              <Field label="Address" value={profile.address} />
            </dl>
          </Panel>
        </div>

        <div>
          {can('users.verify') && (
            <Panel title="Verification" className="mb-4">
              <VerificationControls profile={profile} onChanged={load} />
            </Panel>
          )}

          <Panel title="History" description="What staff have done to this profile.">
            {profile.auditTrail.length === 0 ? (
              <EmptyState icon={History} title="No staff activity yet" />
            ) : (
              <ol className="flex flex-col gap-3">
                {profile.auditTrail.map((entry) => (
                  <li key={entry.id} className="text-xs">
                    <p className="font-medium text-gray-700">{describeAction(entry.action)}</p>
                    <p className="text-gray-400">
                      {entry.actor
                        ? `${entry.actor.firstName} ${entry.actor.lastName}`
                        : 'Unknown staff'}{' '}
                      · {formatDateTime(entry.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>
    </AdminPage>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="font-semibold text-gray-800">{value}</dd>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="text-sm text-gray-700">{value || '—'}</dd>
    </div>
  )
}

const ACTION_LABELS: Record<string, string> = {
  'user.create': 'Profile created',
  'user.update': 'Profile edited',
  'user.verify': 'Verification changed',
  'user.active': 'Activation changed',
  'user.delete': 'Profile deleted',
  'moderator.create': 'Staff account created',
  'moderator.update': 'Staff account changed',
  'moderator.resetPassword': 'Password reset',
}

function describeAction(action: string): string {
  return ACTION_LABELS[action] ?? action
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function ViewUserPage() {
  return (
    <Suspense fallback={<LoadingPanel />}>
      <ViewUserInner />
    </Suspense>
  )
}
