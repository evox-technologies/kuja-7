/** Shared shapes for the admin portal. Mirrors what apps/api/src/admin returns. */

export type Role = 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN'

export type VerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED'

export type Gender = 'MALE' | 'FEMALE'

/** Staff roles, in ascending order of authority. */
export const STAFF_ROLES: Role[] = ['MODERATOR', 'ADMIN', 'SUPER_ADMIN']

export function isStaff(role: Role | undefined | null): boolean {
  return !!role && STAFF_ROLES.includes(role)
}

export const ROLE_LABELS: Record<Role, string> = {
  USER: 'Member',
  MODERATOR: 'Moderator',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super admin',
}

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  PENDING: 'Pending',
  UNDER_REVIEW: 'Under review',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
}

export const VERIFICATION_ORDER: VerificationStatus[] = [
  'PENDING',
  'UNDER_REVIEW',
  'VERIFIED',
  'REJECTED',
]

export interface StaffRef {
  id: string
  firstName: string
  lastName: string
  role: Role
}

export interface AdminMe {
  id: string
  firstName: string
  lastName: string
  email: string
  role: Role
  avatarUrl: string | null
  images: string[]
  permissions: string[]
  allPermissions: string[]
}

export interface AdminUserRow {
  id: string
  firstName: string
  lastName: string
  email: string
  gender: Gender
  dateOfBirth: string
  role: Role
  avatarUrl: string | null
  images: string[]
  city: string | null
  country: string | null
  kujaNumber: string | null
  isActive: boolean
  isVerified: boolean
  isDummy: boolean
  verificationStatus: VerificationStatus
  profileCompleted: boolean
  createdAt: string
  createdById: string | null
  createdBy: StaffRef | null
}

export interface AdminUserList {
  profiles: AdminUserRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface AuditEntry {
  id: string
  actorId: string
  action: string
  targetId: string | null
  meta: Record<string, unknown> | null
  createdAt: string
  actor: StaffRef | null
}

/** Every profile column, plus what the detail screen adds on top. */
export interface AdminUserDetail extends AdminUserRow {
  religion: string | null
  profession: string | null
  location: string | null
  bio: string | null
  nationality: string | null
  height: string | null
  ethnicity: string | null
  caste: string | null
  civilStatus: string | null
  stateDistrict: string | null
  educationLevel: string | null
  drinking: string | null
  smoking: string | null
  foodPreference: string | null
  birthDay: string | null
  mobileNumber: string | null
  whatsappNumber: string | null
  address: string | null
  rejectionReason: string | null
  verifiedAt: string | null
  updatedAt: string
  updatedBy: StaffRef | null
  verifiedBy: StaffRef | null
  activity: {
    interestsSent: number
    interestsReceived: number
    conversations: number
  }
  auditTrail: AuditEntry[]
}

export interface Moderator {
  id: string
  firstName: string
  lastName: string
  email: string
  role: Role
  isActive: boolean
  createdAt: string
  canSignIn: boolean
  profilesCreated: number
  profilesEdited: number
}

export interface DailyCount {
  moderatorId: string
  day: string
  count: number
}

export interface ModeratorActivity {
  from: string
  to: string
  days: string[]
  moderators: (StaffRef & {
    created: DailyCount[]
    edited: DailyCount[]
    totalCreated: number
    totalEdited: number
  })[]
}

export interface PermissionDescriptor {
  key: string
  label: string
  group: string
  available: boolean
}

export interface RoleMatrix {
  catalogue: PermissionDescriptor[]
  roles: {
    role: Role
    permissions: string[]
    locked: boolean
    editable: boolean
  }[]
}

export interface LabelledValue {
  label: string
  value: number
}

export interface AdminStats {
  windowDays: number
  totals: {
    totalUsers: number
    activeUsers: number
    inactiveUsers: number
    verified: number
    unverified: number
    pendingVerification: number
    underReview: number
    rejected: number
    dummyProfiles: number
    newInPeriod: number
    profileCompletionRate: number
  }
  gender: LabelledValue[]
  ageDistribution: LabelledValue[]
  topLocations: LabelledValue[]
  engagement: {
    interestsSent: number
    interestsAccepted: number
    matches: number
    conversations: number
    messagesInPeriod: number
  }
  funnel: LabelledValue[]
  registrations: { day: string; count: number }[]
}

export interface ModeratorStats {
  windowDays: number
  profilesCreated: number
  profilesCreatedInPeriod: number
  profilesEdited: number
  pendingVerification: number
}
