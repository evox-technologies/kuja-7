'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingPanel } from '@/components/ui/spinner'
import { AdminPage, PageHeader, Panel } from '@/components/admin/page-header'
import {
  CategoryBarChart,
  Funnel,
  SplitBar,
  StatTile,
  TimeSeriesChart,
} from '@/components/admin/charts'
import { useAdminAuth } from '@/contexts/admin-auth'
import { adminApi } from '@/lib/admin/api'
import { errorMessage } from '@/lib/api'
import type { AdminStats, ModeratorStats } from '@/lib/admin/types'

/**
 * Two dashboards behind one route: the platform view for anyone with
 * statistics.view, and a moderator's own output for anyone without it. A
 * moderator should always be able to see what they have done, even when the
 * platform-wide numbers are not theirs to see.
 */
export default function AdminDashboardPage() {
  const { can, me } = useAdminAuth()
  const showPlatform = can('statistics.view')

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [mine, setMine] = useState<ModeratorStats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const request = showPlatform ? adminApi.stats() : adminApi.myStats()
    request
      .then((result) => {
        if (showPlatform) setStats(result as AdminStats)
        else setMine(result as ModeratorStats)
      })
      .catch((err) => setError(errorMessage(err, 'Could not load the dashboard')))
  }, [showPlatform])

  if (error) {
    return (
      <AdminPage>
        <p className="text-sm text-danger">{error}</p>
      </AdminPage>
    )
  }

  if (!showPlatform) {
    if (!mine) return <LoadingPanel />
    return (
      <AdminPage>
        <PageHeader
          title={`Welcome, ${me.firstName}`}
          description={`Your activity over the last ${mine.windowDays} days.`}
        />
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Profiles created" value={mine.profilesCreated} hint="All time" />
          <StatTile
            label="Created recently"
            value={mine.profilesCreatedInPeriod}
            hint={`Last ${mine.windowDays} days`}
          />
          <StatTile label="Profiles edited" value={mine.profilesEdited} hint="All time" />
          <StatTile
            label="Awaiting review"
            value={mine.pendingVerification}
            tone={mine.pendingVerification > 0 ? 'warning' : 'default'}
            hint="Across the platform"
          />
        </div>

        {mine.pendingVerification > 0 && (
          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                {mine.pendingVerification}{' '}
                {mine.pendingVerification === 1 ? 'profile is' : 'profiles are'} waiting to be
                reviewed.
              </p>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/admin/verification">
                  Open the queue
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Panel>
        )}
      </AdminPage>
    )
  }

  if (!stats) return <LoadingPanel />

  const { totals, engagement } = stats

  return (
    <AdminPage>
      <PageHeader
        title="Dashboard"
        description={`Platform overview. Trends cover the last ${stats.windowDays} days.`}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Total users"
          value={totals.totalUsers}
          hint={`${totals.dummyProfiles} sample profiles`}
        />
        <StatTile
          label="New registrations"
          value={totals.newInPeriod}
          hint={`Last ${stats.windowDays} days`}
        />
        <StatTile
          label="Active"
          value={totals.activeUsers}
          hint={`${totals.inactiveUsers} deactivated`}
        />
        <StatTile
          label="Profile completion"
          value={`${totals.profileCompletionRate}%`}
          hint="Can send interests"
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Verified" value={totals.verified} tone="success" />
        <StatTile
          label="Pending"
          value={totals.pendingVerification}
          tone={totals.pendingVerification > 0 ? 'warning' : 'default'}
        />
        <StatTile label="Under review" value={totals.underReview} />
        <StatTile
          label="Rejected"
          value={totals.rejected}
          tone={totals.rejected > 0 ? 'danger' : 'default'}
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Registrations" description="New profiles per day" className="lg:col-span-2">
          <TimeSeriesChart data={stats.registrations} />
        </Panel>

        <Panel title="Conversion" description="Registrations through to conversations">
          <Funnel steps={stats.funnel} />
        </Panel>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Gender split">
          <SplitBar data={stats.gender} />
        </Panel>

        <Panel title="Age distribution">
          <CategoryBarChart data={stats.ageDistribution} height={180} />
        </Panel>

        <Panel title="Top cities">
          {stats.topLocations.length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-400">No locations recorded yet</p>
          ) : (
            <CategoryBarChart data={stats.topLocations} height={180} horizontal />
          )}
        </Panel>
      </div>

      <Panel title="Engagement" description={`Messages counted over the last ${stats.windowDays} days.`}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile label="Interests sent" value={engagement.interestsSent} />
          <StatTile label="Interests accepted" value={engagement.interestsAccepted} />
          <StatTile label="Matches" value={engagement.matches} />
          <StatTile label="Conversations" value={engagement.conversations} />
          <StatTile label="New messages" value={engagement.messagesInPeriod} />
        </div>
      </Panel>

      <p className="mt-4 text-xs text-gray-400">
        Reported users, blocked users, paid users and revenue are not shown: this platform has no
        reporting, blocking or billing data to draw them from yet.
      </p>
    </AdminPage>
  )
}
