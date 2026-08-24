'use client'

import { Check, Minus } from 'lucide-react'
import { AdminPage, PageHeader, Panel } from '@/components/admin/page-header'
import { Badge } from '@/components/ui/badge'
import { useAdminAuth } from '@/contexts/admin-auth'
import { modules } from '@/lib/admin/modules'
import { isSuperAdmin, ROLE_LABELS } from '@/lib/admin/types'

const MODULE_LABELS: Record<keyof typeof modules, string> = {
  users: 'Users',
  profileVerification: 'Verification',
  statistics: 'Statistics',
  moderators: 'Moderators',
  rolesPermissions: 'Roles & Permissions',
  settings: 'Settings',
  locations: 'Locations',
  masterData: 'Master Data',
}

export default function SettingsPage() {
  const { me } = useAdminAuth()

  // The module list is a build-time deployment concern, not an account detail —
  // admins and moderators get the account panel only.
  const showModules = isSuperAdmin(me.role)

  return (
    <AdminPage>
      <PageHeader
        title="Settings"
        description={showModules ? 'Your account, and what this deployment runs.' : 'Your account.'}
      />

      <Panel title="Your account" className={showModules ? 'mb-4' : undefined}>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-gray-400">Name</dt>
            <dd className="text-sm text-gray-700">
              {me.firstName} {me.lastName}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-gray-400">Email</dt>
            <dd className="text-sm text-gray-700">{me.email}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-gray-400">Role</dt>
            <dd className="text-sm text-gray-700">{ROLE_LABELS[me.role]}</dd>
          </div>
        </dl>

        <div className="mt-4">
          <p className="mb-1.5 text-[10px] uppercase tracking-wide text-gray-400">
            Your permissions
          </p>
          <div className="flex flex-wrap gap-1">
            {me.permissions.length === 0 ? (
              <span className="text-xs text-gray-400">None</span>
            ) : (
              me.permissions.map((permission) => (
                <Badge key={permission} tone="neutral">
                  {permission}
                </Badge>
              ))
            )}
          </div>
        </div>
      </Panel>

      {showModules && (
        <Panel
          title="Modules"
          description="Set at build time in lib/admin/modules.ts. A module you cannot see is either switched off here or not yours to open."
        >
          <ul className="divide-y divide-gray-50">
            {(Object.keys(modules) as (keyof typeof modules)[]).map((key) => (
              <li key={key} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-gray-700">{MODULE_LABELS[key]}</span>
                {modules[key] ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                    <Check className="h-3.5 w-3.5" />
                    Enabled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                    <Minus className="h-3.5 w-3.5" />
                    Not built yet
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </AdminPage>
  )
}
