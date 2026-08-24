import {
  BadgeCheck,
  LayoutDashboard,
  MapPin,
  Settings,
  Shield,
  Table2,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { ModuleKey } from './modules'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  /** The module this belongs to; hidden when that module is off. */
  module: ModuleKey
  /** The permission required to see it. Undefined means any staff member. */
  permission?: string
  /** Rendered indented under the entry above it. */
  child?: boolean
}

/**
 * The navigation from section 11 of the requirements. Order is the order it
 * renders in; visibility is decided per viewer by useAdminNav.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    module: 'statistics',
    // Deliberately unguarded: a moderator without statistics.view still gets a
    // dashboard, just their own numbers rather than the platform's.
  },
  { label: 'All Users', href: '/admin/users', icon: Users, module: 'users', permission: 'users.view' },
  {
    label: 'Add User',
    href: '/admin/users/new',
    icon: UserPlus,
    module: 'users',
    permission: 'users.create',
    child: true,
  },
  {
    label: 'Verification',
    href: '/admin/verification',
    icon: BadgeCheck,
    module: 'profileVerification',
    permission: 'users.verify',
  },
  { label: 'Locations', href: '/admin/locations', icon: MapPin, module: 'locations', permission: 'locations.manage' },
  { label: 'Master Data', href: '/admin/master-data', icon: Table2, module: 'masterData', permission: 'masterData.manage' },
  {
    label: 'Moderators',
    href: '/admin/moderators',
    icon: Shield,
    module: 'moderators',
    permission: 'moderators.manage',
  },
  {
    label: 'Roles & Permissions',
    href: '/admin/roles',
    icon: Shield,
    module: 'rolesPermissions',
    permission: 'roles.manage',
  },
  { label: 'Settings', href: '/admin/settings', icon: Settings, module: 'settings' },
]
