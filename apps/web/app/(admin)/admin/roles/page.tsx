'use client'

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { LoadingPanel } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { AdminPage, PageHeader, Panel } from '@/components/admin/page-header'
import { useAdminAuth } from '@/contexts/admin-auth'
import { adminApi } from '@/lib/admin/api'
import { errorMessage } from '@/lib/api'
import { ROLE_LABELS, type Role, type RoleMatrix } from '@/lib/admin/types'

/**
 * The permission matrix from section 9 of the requirements, as data rather than
 * code. Rows are permissions, columns are roles.
 *
 * USER is left out: members hold no admin permissions and never will, so a
 * column of empty boxes would only invite someone to tick one.
 */
export default function RolesPage() {
  const toast = useToast()
  const { refresh } = useAdminAuth()

  const [matrix, setMatrix] = useState<RoleMatrix | null>(null)
  const [draft, setDraft] = useState<Record<string, Set<string>>>({})
  const [saving, setSaving] = useState<Role | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const result = await adminApi.roles()
      setMatrix(result)
      setDraft(
        Object.fromEntries(result.roles.map((r) => [r.role, new Set(r.permissions)]))
      )
    } catch (err) {
      setError(errorMessage(err, 'Could not load the permission matrix'))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // USER holds no admin permissions and never will. SUPER_ADMIN is fixed in
  // code and every box would be ticked and disabled — a column nobody can act
  // on is just noise, so both are left out and explained in the note below.
  const columns = useMemo(
    () => matrix?.roles.filter((r) => r.role !== 'USER' && r.role !== 'SUPER_ADMIN') ?? [],
    [matrix]
  )

  const groups = useMemo(() => {
    if (!matrix) return []
    const available = matrix.catalogue.filter((p) => p.available)
    const order: string[] = []
    const byGroup = new Map<string, typeof available>()
    for (const permission of available) {
      if (!byGroup.has(permission.group)) {
        byGroup.set(permission.group, [])
        order.push(permission.group)
      }
      byGroup.get(permission.group)!.push(permission)
    }
    return order.map((group) => ({ group, permissions: byGroup.get(group)! }))
  }, [matrix])

  if (error) {
    return (
      <AdminPage>
        <p className="text-sm text-danger">{error}</p>
      </AdminPage>
    )
  }
  if (!matrix) return <LoadingPanel />

  function toggle(role: Role, permission: string, checked: boolean) {
    setDraft((current) => {
      const next = new Set(current[role] ?? [])
      if (checked) next.add(permission)
      else next.delete(permission)
      return { ...current, [role]: next }
    })
  }

  function isDirty(role: Role): boolean {
    const original = matrix!.roles.find((r) => r.role === role)?.permissions ?? []
    const now = draft[role] ?? new Set<string>()
    return original.length !== now.size || original.some((p) => !now.has(p))
  }

  async function save(role: Role) {
    setSaving(role)
    try {
      await adminApi.setRolePermissions(role, [...(draft[role] ?? [])])
      toast.success(`${ROLE_LABELS[role]} permissions updated.`)
      await load()
      // The signed-in user's own nav may have just changed.
      await refresh()
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save these permissions'))
    } finally {
      setSaving(null)
    }
  }

  return (
    <AdminPage>
      <PageHeader
        title="Roles & Permissions"
        description="What each role may do. Changes take effect on the next request — no redeploy."
      />

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-2 pr-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Permission
                </th>
                {columns.map((column) => (
                  <th key={column.role} className="px-3 py-2 text-center">
                    <span className="block text-xs font-semibold text-gray-800">
                      {ROLE_LABELS[column.role]}
                    </span>
                    {column.locked && (
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-normal text-gray-400">
                        <Lock className="h-3 w-3" />
                        Fixed
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map(({ group, permissions }) => (
                <Fragment key={group}>
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400"
                    >
                      {group}
                    </td>
                  </tr>
                  {permissions.map((permission) => (
                    <tr key={permission.key} className="border-b border-gray-50">
                      <td className="py-2.5 pr-3">
                        <span className="text-gray-700">{permission.label}</span>
                        <code className="ml-2 text-[10px] text-gray-300">{permission.key}</code>
                      </td>
                      {columns.map((column) => (
                        <td key={column.role} className="px-3 py-2.5 text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={draft[column.role]?.has(permission.key) ?? false}
                              disabled={!column.editable}
                              onCheckedChange={(checked) =>
                                toggle(column.role, permission.key, checked === true)
                              }
                              aria-label={`${permission.label} for ${ROLE_LABELS[column.role]}`}
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {columns
            .filter((column) => column.editable && isDirty(column.role))
            .map((column) => (
              <Button
                key={column.role}
                className="rounded-xl"
                loading={saving === column.role}
                onClick={() => void save(column.role)}
              >
                Save {ROLE_LABELS[column.role]}
              </Button>
            ))}
        </div>
      </Panel>

      <p className="mt-3 text-xs text-gray-400">
        Super admin is not shown: it holds every permission and cannot be edited, otherwise one
        bad save could lock everybody out of this screen. Locations and Master Data are hidden
        until those modules are built.
      </p>
    </AdminPage>
  )
}
