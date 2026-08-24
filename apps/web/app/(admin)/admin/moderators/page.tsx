'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { KeyRound, Power, Shield, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LoadingPanel } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { AdminPage, PageHeader, Panel } from '@/components/admin/page-header'
import { ActiveBadge, RoleBadge } from '@/components/admin/status-badge'
import { StackedDailyChart, StatTile } from '@/components/admin/charts'
import { CreateModeratorDialog } from '@/components/admin/create-moderator-dialog'
import { ResetPasswordDialog } from '@/components/admin/reset-password-dialog'
import { adminApi } from '@/lib/admin/api'
import { errorMessage } from '@/lib/api'
import type { Moderator, ModeratorActivity } from '@/lib/admin/types'

const RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
]

export default function ModeratorsPage() {
  const toast = useToast()
  const [moderators, setModerators] = useState<Moderator[] | null>(null)
  const [activity, setActivity] = useState<ModeratorActivity | null>(null)
  const [days, setDays] = useState(30)
  const [creating, setCreating] = useState(false)
  const [resetting, setResetting] = useState<Moderator | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const from = new Date()
      from.setDate(from.getDate() - days)
      const [list, chart] = await Promise.all([
        adminApi.listModerators(),
        adminApi.moderatorActivity(from.toISOString(), new Date().toISOString()),
      ])
      setModerators(list)
      setActivity(chart)
    } catch (err) {
      setError(errorMessage(err, 'Could not load moderators'))
    }
  }, [days])

  useEffect(() => {
    void load()
  }, [load])

  async function toggleActive(moderator: Moderator) {
    try {
      await adminApi.updateModerator(moderator.id, { isActive: !moderator.isActive })
      toast.success(
        `${moderator.firstName} ${moderator.lastName} ${
          moderator.isActive ? 'deactivated' : 'reactivated'
        }.`
      )
      void load()
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update this account'))
    }
  }

  if (error) {
    return (
      <AdminPage>
        <p className="text-sm text-danger">{error}</p>
      </AdminPage>
    )
  }

  if (!moderators || !activity) return <LoadingPanel />

  // Only staff who actually did something appear in the chart — an empty series
  // per idle moderator would be noise, and colours are assigned by index over
  // the filtered list so they stay stable within a render.
  const chartSeries = activity.moderators
    .filter((m) => m.totalCreated > 0)
    .map((m) => ({
      id: m.id,
      name: `${m.firstName} ${m.lastName}`,
      byDay: Object.fromEntries(m.created.map((c) => [c.day, c.count])),
    }))

  const totalCreated = activity.moderators.reduce((sum, m) => sum + m.totalCreated, 0)
  const totalEdited = activity.moderators.reduce((sum, m) => sum + m.totalEdited, 0)

  return (
    <AdminPage>
      <PageHeader
        title="Moderators"
        description="Staff accounts, what they can do, and how much they are getting through."
        actions={
          <Button className="rounded-xl" onClick={() => setCreating(true)}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            Add moderator
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Staff accounts" value={moderators.length} />
        <StatTile
          label="Active"
          value={moderators.filter((m) => m.isActive).length}
          hint={`${moderators.filter((m) => !m.isActive).length} deactivated`}
        />
        <StatTile label="Profiles created" value={totalCreated} hint={`Last ${days} days`} />
        <StatTile label="Profiles edited" value={totalEdited} hint={`Last ${days} days`} />
      </div>

      <Panel
        title="Profiles created per day"
        description="Stacked by moderator, so the height of a column is that day's total."
        className="mb-4"
        actions={
          <div className="flex gap-1 rounded-full bg-gray-100 p-0.5">
            {RANGES.map((range) => (
              <button
                key={range.days}
                type="button"
                onClick={() => setDays(range.days)}
                className={
                  'rounded-full px-3 py-1 text-xs transition-colors ' +
                  (days === range.days
                    ? 'bg-white font-semibold text-brand-text shadow-sm'
                    : 'text-gray-500 hover:text-gray-800')
                }
              >
                {range.label}
              </button>
            ))}
          </div>
        }
      >
        {chartSeries.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No profiles created in this period"
            description="Sample profiles added by staff will appear here, broken down by day."
          />
        ) : (
          <StackedDailyChart days={activity.days} series={chartSeries} />
        )}
      </Panel>

      <Panel title="Staff accounts">
        {moderators.length === 0 ? (
          <EmptyState icon={Shield} title="No staff accounts yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Created</TableHead>
                <TableHead className="text-right">Edited</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-40" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {moderators.map((moderator) => (
                <TableRow key={moderator.id}>
                  <TableCell>
                    <p className="font-semibold text-gray-900">
                      {moderator.firstName} {moderator.lastName}
                    </p>
                    <p className="text-xs text-gray-400">{moderator.email}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      <RoleBadge role={moderator.role} />
                      {!moderator.isActive && <ActiveBadge isActive={false} />}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    <Link
                      href={`/admin/users?createdById=${moderator.id}`}
                      className="hover:text-brand-hover"
                    >
                      {moderator.profilesCreated}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-gray-600">
                    {moderator.profilesEdited}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-gray-500">
                    {new Date(moderator.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => setResetting(moderator)}
                        disabled={!moderator.canSignIn}
                        title={
                          moderator.canSignIn
                            ? undefined
                            : 'This profile has no sign-in account'
                        }
                      >
                        <KeyRound className="mr-1 h-3.5 w-3.5" />
                        Password
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => void toggleActive(moderator)}
                      >
                        <Power className="mr-1 h-3.5 w-3.5" />
                        {moderator.isActive ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      <CreateModeratorDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => {
          setCreating(false)
          void load()
        }}
      />

      <ResetPasswordDialog
        moderator={resetting}
        onClose={() => setResetting(null)}
        onDone={() => setResetting(null)}
      />
    </AdminPage>
  )
}
