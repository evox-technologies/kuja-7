'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BadgeCheck,
  Eye,
  MoreHorizontal,
  Pencil,
  Power,
  Search,
  Trash2,
  UserPlus,
  Users as UsersIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LoadingPanel } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { AdminPage, PageHeader, Panel } from '@/components/admin/page-header'
import {
  ActiveBadge,
  RoleBadge,
  SampleBadge,
  VerificationBadge,
} from '@/components/admin/status-badge'
import { DeleteUserDialog } from '@/components/admin/delete-user-dialog'
import { useAdminAuth } from '@/contexts/admin-auth'
import { adminApi, type UserFilters } from '@/lib/admin/api'
import { errorMessage } from '@/lib/api'
import { defaultAvatarSrc } from '@/lib/avatar'
import {
  VERIFICATION_ORDER,
  VERIFICATION_LABELS,
  type AdminUserList,
  type AdminUserRow,
} from '@/lib/admin/types'

const selectCls =
  'text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-border focus:border-brand transition-colors'

function UsersPageInner() {
  const router = useRouter()
  const toast = useToast()
  const { can } = useAdminAuth()

  const [filters, setFilters] = useState<UserFilters>({ page: 1, sort: 'newest' })
  const [search, setSearch] = useState('')
  const [data, setData] = useState<AdminUserList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState<AdminUserRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await adminApi.listUsers(filters))
    } catch (err) {
      setError(errorMessage(err, 'Could not load users'))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    void load()
  }, [load])

  // Debounced so typing a name is not one request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      setFilters((f) => (f.q === search ? f : { ...f, q: search, page: 1 }))
    }, 300)
    return () => clearTimeout(id)
  }, [search])

  function patch(next: Partial<UserFilters>) {
    setFilters((f) => ({ ...f, ...next, page: 1 }))
  }

  async function toggleActive(user: AdminUserRow) {
    try {
      await adminApi.setActive(user.id, !user.isActive)
      toast.success(
        `${user.firstName} ${user.lastName} ${user.isActive ? 'deactivated' : 'reactivated'}.`
      )
      void load()
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update this account'))
    }
  }

  async function verify(user: AdminUserRow) {
    try {
      await adminApi.setVerification(user.id, 'VERIFIED')
      toast.success(`${user.firstName} ${user.lastName} verified.`)
      void load()
    } catch (err) {
      toast.error(errorMessage(err, 'Could not verify this profile'))
    }
  }

  return (
    <AdminPage>
      <PageHeader
        title="Users"
        description="Everyone on the platform — members and the sample profiles staff have added."
        actions={
          can('users.create') && (
            <Button asChild className="rounded-xl">
              <Link href="/admin/users/new">
                <UserPlus className="mr-1.5 h-4 w-4" />
                Add user
              </Link>
            </Button>
          )
        }
      />

      <Panel className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, city or Kuja number"
              aria-label="Search users"
              className={`${selectCls} w-full pl-9`}
            />
          </div>

          <select
            aria-label="Verification status"
            className={selectCls}
            value={filters.verificationStatus ?? ''}
            onChange={(e) =>
              patch({ verificationStatus: e.target.value as UserFilters['verificationStatus'] })
            }
          >
            <option value="">Any status</option>
            {VERIFICATION_ORDER.map((status) => (
              <option key={status} value={status}>
                {VERIFICATION_LABELS[status]}
              </option>
            ))}
          </select>

          <select
            aria-label="Gender"
            className={selectCls}
            value={filters.gender ?? ''}
            onChange={(e) => patch({ gender: e.target.value })}
          >
            <option value="">Any gender</option>
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
          </select>

          <select
            aria-label="Account state"
            className={selectCls}
            value={filters.isActive === undefined ? '' : String(filters.isActive)}
            onChange={(e) =>
              patch({ isActive: e.target.value === '' ? undefined : e.target.value === 'true' })
            }
          >
            <option value="">Active &amp; deactivated</option>
            <option value="true">Active only</option>
            <option value="false">Deactivated only</option>
          </select>

          <select
            aria-label="Profile type"
            className={selectCls}
            value={filters.isDummy === undefined ? '' : String(filters.isDummy)}
            onChange={(e) =>
              patch({ isDummy: e.target.value === '' ? undefined : e.target.value === 'true' })
            }
          >
            <option value="">All profiles</option>
            <option value="false">Real members</option>
            <option value="true">Sample profiles</option>
          </select>

          <select
            aria-label="Sort order"
            className={selectCls}
            value={filters.sort ?? 'newest'}
            onChange={(e) => patch({ sort: e.target.value as UserFilters['sort'] })}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">By name</option>
          </select>
        </div>
      </Panel>

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
            icon={UsersIcon}
            title="No users match these filters"
            description="Try clearing the search or widening the filters above."
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Added by</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.profiles.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar user={user} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-semibold text-gray-900">
                              {user.firstName} {user.lastName}
                            </span>
                            <RoleBadge role={user.role} />
                            {user.isDummy && <SampleBadge />}
                          </div>
                          <p className="truncate text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <VerificationBadge status={user.verificationStatus} />
                        {!user.isActive && <ActiveBadge isActive={false} />}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {[user.city, user.country].filter(Boolean).join(', ') || '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-gray-500">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {user.createdBy
                        ? `${user.createdBy.firstName} ${user.createdBy.lastName}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label={`Actions for ${user.firstName} ${user.lastName}`}
                            className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onSelect={() => router.push(`/admin/users/view?id=${user.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </DropdownMenuItem>

                          {can('users.edit') && (
                            <DropdownMenuItem
                              onSelect={() => router.push(`/admin/users/edit?id=${user.id}`)}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}

                          {can('users.verify') && user.verificationStatus !== 'VERIFIED' && (
                            <DropdownMenuItem onSelect={() => void verify(user)}>
                              <BadgeCheck className="h-4 w-4" />
                              Verify
                            </DropdownMenuItem>
                          )}

                          {can('users.edit') && (
                            <DropdownMenuItem onSelect={() => void toggleActive(user)}>
                              <Power className="h-4 w-4" />
                              {user.isActive ? 'Deactivate' : 'Reactivate'}
                            </DropdownMenuItem>
                          )}

                          {can('users.delete') && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                destructive
                                onSelect={() => setPendingDelete(user)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Pagination
              className="mt-4"
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              pageSize={data.pageSize}
              onChange={(page) => setFilters((f) => ({ ...f, page }))}
            />
          </>
        )}
      </Panel>

      <DeleteUserDialog
        user={pendingDelete}
        onClose={() => setPendingDelete(null)}
        onDeleted={() => {
          setPendingDelete(null)
          void load()
        }}
      />
    </AdminPage>
  )
}

function Avatar({ user }: { user: AdminUserRow }) {
  const src = user.images?.[0] ?? user.avatarUrl ?? defaultAvatarSrc(user.gender)
  return (
    <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gray-100">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <UsersIcon className="h-4 w-4 text-gray-300" />
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<LoadingPanel />}>
      <UsersPageInner />
    </Suspense>
  )
}
