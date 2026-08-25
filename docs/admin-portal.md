# Admin & moderator portal

Staff sign in at **`/admin`** on the same domain as the member site. It is the same
Supabase login — there is no second set of credentials — so access is decided by the
`role` on the profile, not by which URL you arrive at.

- **Admin / Super admin** — everything they hold permissions for.
- **Moderator** — Dashboard, Users, Verification by default.
- **Member** — bounced with "That account does not have access to the admin portal."

The front-end hides what you cannot do, but the API is what enforces it: every
`/api/v1/admin/*` route is behind `JwtAuthGuard → RolesGuard → PermissionsGuard`.

---

## First run: create the first admin

Nothing in the application can promote anyone — `role` is never written by any
member-facing endpoint — so the first staff account is made by hand. Do this once,
against the database the API is pointed at.

```bash
# The person must have signed up through the site first, so a profile and a
# Supabase auth user already exist to promote.
pnpm --filter api exec ts-node scripts/make-admin.ts you@example.com
```

Passing a role is optional and defaults to `SUPER_ADMIN`:

```bash
pnpm --filter api exec ts-node scripts/make-admin.ts them@example.com ADMIN
```

After that, every other staff account is created from **Moderators → Add moderator**,
which mints the Supabase auth user for them. No confirmation email is sent, so hand
the temporary password over yourself.

Super admin is deliberately un-editable in the permission matrix: one bad save would
otherwise lock everyone out of the screen that fixes it.

---

## Sample profiles

A profile added from **Users → Add user** with **Sample profile** ticked behaves
differently from a real member, and staff should know this before they create one:

- It has **no sign-in account** at all (`supabaseId` is null), so nobody can ever log
  in as it.
- **Any interest a member sends it is matched instantly** — the interest is accepted
  and a reciprocal one is sent back, so it appears under Mutual Interests straight
  away and the member gets an "accepted" notification.
- **Any request for its contact details is approved on the spot** — both directions
  are written, because contact details are only revealed once both sides have
  accepted.
- A conversation is opened by that match, and **nobody will ever reply in it.**

This is what makes the site look populated before launch. It is also why sample
profiles carry a badge everywhere they appear.

The behaviour lives in `apps/api/src/matches/matches.service.ts`
(`autoReciprocateInterest`, `autoApproveContactRequest`) and is covered by
`apps/api/test/dummy-profile.integration-spec.ts`.

---

## Verification

Profiles move through **Pending → Under review → Verified → Rejected**. Rejecting
requires a reason, which is shown on the profile afterwards.

`isVerified` — the flag member browse results filter on — is kept in step
automatically: `VERIFIED` sets it true, anything else sets it false. Moving a profile
out of Verified therefore removes it from search immediately.

**New signups are still auto-verified on this deployment**, exactly as before this
portal existed, so nothing changed for members. The queue is a tool staff opt into by
moving a profile into it. To make every new signup wait for approval instead, change
the default on `Profile.verificationStatus` in `apps/api/prisma/schema.prisma` to
`PENDING` and set `isVerified` to default `false` — but be aware nobody who signs up
will be visible until a moderator gets to them.

---

## Roles & permissions

The matrix is **data, not code** — it lives in the `role_permissions` table and is
edited from **Roles & Permissions**. Changes take effect on the next request; no
redeploy.

Permission keys: `users.view`, `users.create`, `users.edit`, `users.delete`,
`users.verify`, `statistics.view`, `moderators.manage`, `roles.manage`,
`settings.manage`. Defaults are seeded by migration
`20260823000001_seed_role_permissions`: admins get everything, moderators get view,
create, edit and verify.

`locations.manage` and `masterData.manage` exist as keys but are hidden — their
modules are not built.

---

## Turning modules off per client

`apps/web/lib/admin/modules.ts` decides which modules this deployment runs. Setting
one to `false` removes it from the navigation and makes its screens unreachable:

```ts
export const modules = {
  users: true,
  profileVerification: true,
  statistics: false,   // ← Statistics disappears from the nav
  ...
}
```

A module renders only when it is **enabled here and** the signed-in staff member holds
the permission behind it. The web app is a static export, so a change here needs a
rebuild.

---

## What this portal does not have

Called out so nobody goes looking:

- **Location management and master data** (requirements §5 and §6) are not built.
  Profile option lists still come from `apps/web/lib/options.ts`.
- **Reported users, blocked users, paid users and revenue** are absent from the
  dashboard — the platform has no reporting, blocking or billing data to draw them
  from. They are omitted rather than shown as zero.
- **Deleting a member is permanent** and takes their interests, shortlists, contact
  requests and whole conversations — including the other person's messages — with it.
  Deactivating is the reversible option and the dialog offers it.
