'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingPanel } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { Pagination } from '@/components/ui/pagination'
import { useToast } from '@/components/ui/toast'
import { AdminPage, PageHeader, Panel } from '@/components/admin/page-header'
import { SampleBadge, VerificationBadge } from '@/components/admin/status-badge'
import { adminApi } from '@/lib/admin/api'
import { errorMessage } from '@/lib/api'
import { defaultAvatarSrc } from '@/lib/avatar'
import {
  VERIFICATION_LABELS,
  VERIFICATION_ORDER,
  type AdminUserList,
  type AdminUserRow,
  type VerificationStatus,
} from '@/lib/admin/types'
import { cn } from '@/lib/utils'

/**
 * The moderation queue. Tabs are the workflow states, so "what needs looking
 * at" is one click rather than a filter combination.
 */
export default function VerificationPage() {
  const toast = useToast()
  const [status, setStatus] = useState<VerificationStatus>('PENDING')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<AdminUserList | null>(null)
  const [counts, setCounts] = useState<Partial<Record<VerificationStatus, number>>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [list, ...totals] = await Promise.all([
        adminApi.listUsers({ verificationStatus: status, page, sort: 'oldest' }),
        ...VERIFICATION_ORDER.map((s) =>
          adminApi.listUsers({ verificationStatus: s, pageSize: 1 })
        ),
      ])
      setData(list)
      setCounts(
        Object.fromEntries(VERIFICATION_ORDER.map((s, i) => [s, totals[i].total]))
      )
    } catch (err) {
      setError(errorMessage(err, 'Could not load the verification queue'))
    } finally {
      setLoading(false)
    }
  }, [status, page])

  useEffect(() => {
    void load()
  }, [load])

  async function decide(user: AdminUserRow, next: VerificationStatus) {
    try {
      await adminApi.setVerification(user.id, next)
      toast.success(
        `${user.firstName} ${user.lastName} marked ${VERIFICATION_LABELS[next].toLowerCase()}.`
      )
      void load()
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update this profile'))
    }
  }

  return (
    <AdminPage>
      <PageHeader
        title="Verification"
        description="Review profiles before they appear in member search results."
      />

      <div className="mb-4 flex flex-wrap gap-1 rounded-full bg-gray-100 p-1">
        {VERIFICATION_ORDER.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setStatus(s)
              setPage(1)
            }}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm transition-colors',
              status === s
                ? 'bg-white font-semibold text-brand-text shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {VERIFICATION_LABELS[s]}
            {counts[s] !== undefined && (
              <span className="ml-1.5 text-xs text-gray-400">{counts[s]}</span>
            )}
          </button>
        ))}
      </div>

      <Panel>
        {loading && !data ? (
          <LoadingPanel />
        ) : error ? (
          <div className="py-10 text-center">
            <p className="text-sm text-danger">{error}</p>
            <Button variant="outline" className="mt-3 rounded-xl" onClick={() => void load()}>
              Try again
            </Button>
          </div>
        ) : !data || data.profiles.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title={`Nothing ${VERIFICATION_LABELS[status].toLowerCase()}`}
            description={
              status === 'PENDING'
                ? 'New signups are verified automatically on this deployment. Move a profile here from its detail screen when it needs a second look.'
                : undefined
            }
          />
        ) : (
          <>
            <ul className="flex flex-col divide-y divide-gray-50">
              {data.profiles.map((user) => {
                const avatar =
                  user.images?.[0] ?? user.avatarUrl ?? defaultAvatarSrc(user.gender)
                return (
                  <li key={user.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-gray-100">
                      {avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatar} alt="" loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <BadgeCheck className="h-4 w-4 text-gray-300" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link
                          href={`/admin/users/view?id=${user.id}`}
                          className="truncate font-semibold text-gray-900 hover:text-brand-hover"
                        >
                          {user.firstName} {user.lastName}
                        </Link>
                        <VerificationBadge status={user.verificationStatus} />
                        {user.isDummy && <SampleBadge />}
                      </div>
                      <p className="truncate text-xs text-gray-400">
                        {[user.email, [user.city, user.country].filter(Boolean).join(', ')]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button asChild variant="ghost" size="sm" className="rounded-lg">
                        <Link href={`/admin/users/view?id=${user.id}`}>Review</Link>
                      </Button>
                      {status !== 'UNDER_REVIEW' && status !== 'VERIFIED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => void decide(user, 'UNDER_REVIEW')}
                        >
                          Under review
                        </Button>
                      )}
                      {status !== 'VERIFIED' && (
                        <Button
                          size="sm"
                          className="rounded-lg"
                          onClick={() => void decide(user, 'VERIFIED')}
                        >
                          Approve
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>

            <Pagination
              className="mt-4"
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              pageSize={data.pageSize}
              onChange={setPage}
            />
          </>
        )}
      </Panel>

      <p className="mt-3 text-xs text-gray-400">
        Rejecting a profile needs a reason, so it is done from the profile screen.
      </p>
    </AdminPage>
  )
}
