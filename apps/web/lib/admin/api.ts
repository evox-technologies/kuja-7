import { apiFetch, queryString } from '@/lib/api'
import type {
  AdminStats,
  AdminUserDetail,
  AdminUserList,
  ModeratorActivity,
  ModeratorStats,
  Moderator,
  Role,
  RoleMatrix,
  VerificationStatus,
} from './types'

/** Every admin endpoint in one place, so paths are not scattered across screens. */

export interface UserFilters {
  q?: string
  role?: Role | ''
  gender?: string
  verificationStatus?: VerificationStatus | ''
  isActive?: boolean
  isDummy?: boolean
  profileCompleted?: boolean
  createdById?: string
  dateFrom?: string
  dateTo?: string
  sort?: 'newest' | 'oldest' | 'name'
  page?: number
  pageSize?: number
}

export const adminApi = {
  listUsers(filters: UserFilters) {
    return apiFetch<AdminUserList>(`/admin/users${queryString({ ...filters })}`)
  },

  getUser(id: string) {
    return apiFetch<AdminUserDetail>(`/admin/users/${id}`)
  },

  createUser(body: Record<string, unknown>) {
    return apiFetch<AdminUserDetail>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  updateUser(id: string, body: Record<string, unknown>) {
    return apiFetch<AdminUserDetail>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  setVerification(id: string, status: VerificationStatus, rejectionReason?: string) {
    return apiFetch<AdminUserDetail>(`/admin/users/${id}/verification`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...(rejectionReason && { rejectionReason }) }),
    })
  },

  setActive(id: string, isActive: boolean) {
    return apiFetch<AdminUserDetail>(`/admin/users/${id}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    })
  },

  deleteUser(id: string) {
    return apiFetch<{ success: boolean }>(`/admin/users/${id}`, { method: 'DELETE' })
  },

  listModerators() {
    return apiFetch<Moderator[]>('/admin/moderators')
  },

  moderatorActivity(from?: string, to?: string) {
    return apiFetch<ModeratorActivity>(`/admin/moderators/activity${queryString({ from, to })}`)
  },

  createModerator(body: Record<string, unknown>) {
    return apiFetch<Moderator>('/admin/moderators', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  updateModerator(id: string, body: { role?: Role; isActive?: boolean }) {
    return apiFetch<Moderator>(`/admin/moderators/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  resetModeratorPassword(id: string, password: string) {
    return apiFetch<{ success: boolean }>(`/admin/moderators/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    })
  },

  roles() {
    return apiFetch<RoleMatrix>('/admin/roles')
  },

  setRolePermissions(role: Role, permissions: string[]) {
    return apiFetch<{ role: Role; permissions: string[] }>(`/admin/roles/${role}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    })
  },

  stats() {
    return apiFetch<AdminStats>('/admin/stats')
  },

  myStats() {
    return apiFetch<ModeratorStats>('/admin/stats/me')
  },
}
