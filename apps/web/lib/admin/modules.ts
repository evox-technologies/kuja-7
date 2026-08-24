/**
 * Which modules this deployment runs.
 *
 * Turning one off removes it from the navigation and makes its screens
 * unreachable, without touching any other code — that is how one codebase
 * serves clients who bought different things.
 *
 * This is a build-time constant: the web app is a static export, so a change
 * here needs a rebuild to take effect. It is *not* a security control — the
 * API enforces permissions regardless of what the browser was shipped. A
 * module appears only when it is enabled here **and** the signed-in staff
 * member holds the permission behind it.
 */
export const modules = {
  users: true,
  profileVerification: true,
  statistics: true,
  moderators: true,
  rolesPermissions: true,
  settings: true,

  // Not built yet. The permission keys and navigation entries exist so these
  // can be switched on when the modules land, without reshaping anything.
  locations: false,
  masterData: false,
} as const

export type ModuleKey = keyof typeof modules

export function isModuleEnabled(key: ModuleKey): boolean {
  return modules[key]
}
