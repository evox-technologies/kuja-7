/**
 * The permission catalogue. Section 9 of the admin requirements names these
 * keys explicitly, so they are treated as a stable contract — the front-end
 * nav, the guards and the Roles & Permissions matrix all key off them.
 *
 * Which role holds which permission is *data*, not code: see the
 * `role_permissions` table and PermissionsService. This file only says what may
 * exist, and what to call it on screen.
 */

export const PERMISSIONS = {
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  USERS_VERIFY: 'users.verify',
  STATISTICS_VIEW: 'statistics.view',
  MODERATORS_MANAGE: 'moderators.manage',
  ROLES_MANAGE: 'roles.manage',
  SETTINGS_MANAGE: 'settings.manage',
  // Reserved. The Location and Master Data modules are not built yet; the keys
  // exist so the matrix and modules.ts do not need reshaping when they are.
  LOCATIONS_MANAGE: 'locations.manage',
  MASTER_DATA_MANAGE: 'masterData.manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface PermissionDescriptor {
  key: Permission;
  label: string;
  group: string;
  /** Reserved keys are hidden from the matrix until their module ships. */
  available: boolean;
}

export const PERMISSION_CATALOGUE: PermissionDescriptor[] = [
  {
    key: PERMISSIONS.USERS_VIEW,
    label: 'View users',
    group: 'Users',
    available: true,
  },
  {
    key: PERMISSIONS.USERS_CREATE,
    label: 'Add users',
    group: 'Users',
    available: true,
  },
  {
    key: PERMISSIONS.USERS_EDIT,
    label: 'Edit users',
    group: 'Users',
    available: true,
  },
  {
    key: PERMISSIONS.USERS_DELETE,
    label: 'Delete users',
    group: 'Users',
    available: true,
  },
  {
    key: PERMISSIONS.USERS_VERIFY,
    label: 'Verify profiles',
    group: 'Users',
    available: true,
  },
  {
    key: PERMISSIONS.STATISTICS_VIEW,
    label: 'View statistics',
    group: 'Insights',
    available: true,
  },
  {
    key: PERMISSIONS.MODERATORS_MANAGE,
    label: 'Manage moderators',
    group: 'Administration',
    available: true,
  },
  {
    key: PERMISSIONS.ROLES_MANAGE,
    label: 'Manage roles',
    group: 'Administration',
    available: true,
  },
  {
    key: PERMISSIONS.SETTINGS_MANAGE,
    label: 'System settings',
    group: 'Administration',
    available: true,
  },
  {
    key: PERMISSIONS.LOCATIONS_MANAGE,
    label: 'Manage locations',
    group: 'Not yet built',
    available: false,
  },
  {
    key: PERMISSIONS.MASTER_DATA_MANAGE,
    label: 'Manage master data',
    group: 'Not yet built',
    available: false,
  },
];

export const ALL_PERMISSIONS: Permission[] = PERMISSION_CATALOGUE.map(
  (p) => p.key,
);

export function isPermission(value: string): value is Permission {
  return (ALL_PERMISSIONS as string[]).includes(value);
}
