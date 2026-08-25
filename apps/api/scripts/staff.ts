/**
 * Staff account management from outside the application.
 *
 * The portal manages staff itself (POST/PATCH /moderators) but cannot mint the
 * first one: assertMayGrant only lets a SUPER_ADMIN create admin-level roles, and
 * a fresh database has none. This is that bootstrap, and the way back in if the
 * last super admin is locked out.
 *
 *   ts-node scripts/staff.ts create <email> <ROLE> <first> <last> <MALE|FEMALE> <YYYY-MM-DD>
 *   ts-node scripts/staff.ts set-role <email> <ROLE>
 *
 * `create` makes a Supabase auth user and a linked profile — staff never go
 * through onboarding, so nothing else will create one for them. `set-role` only
 * changes the role on a row that already exists; use it to promote a user who
 * signed up normally, or pass USER to revoke all staff access.
 *
 * Uses Prisma rather than raw SQL on purpose: `id` and `updatedAt` are Prisma-side
 * defaults with no database equivalent, so a hand-written INSERT has to invent
 * both and silently rots when the schema gains a required column.
 */
import { PrismaClient, Role, Gender } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

const STAFF_ROLES: Role[] = [Role.MODERATOR, Role.ADMIN, Role.SUPER_ADMIN];
const ALL_ROLES: Role[] = [Role.USER, ...STAFF_ROLES];

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

function parseRole(value: string, allowed: Role[]): Role {
  const role = value?.toUpperCase() as Role;
  if (!allowed.includes(role)) {
    fail(`role must be one of ${allowed.join(' | ')} — got '${value}'`);
  }
  return role;
}

function admin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) fail('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function create(argv: string[]) {
  const [emailRaw, roleRaw, firstName, lastName, genderRaw, dob] = argv;

  if (!emailRaw || !roleRaw || !firstName || !lastName || !genderRaw || !dob) {
    fail(
      'usage: create <email> <ROLE> <first> <last> <MALE|FEMALE> <YYYY-MM-DD>',
    );
  }

  const email = emailRaw.trim().toLowerCase();
  const role = parseRole(roleRaw, STAFF_ROLES);

  const gender = genderRaw.toUpperCase() as Gender;
  if (!Object.values(Gender).includes(gender)) {
    fail(`gender must be one of ${Object.values(Gender).join(' | ')}`);
  }

  const dateOfBirth = new Date(dob);
  if (Number.isNaN(dateOfBirth.getTime())) fail(`'${dob}' is not a valid date`);

  const existing = await prisma.profile.findUnique({ where: { email } });
  if (existing) {
    fail(
      `a profile already exists for ${email} (role ${existing.role}) — use set-role`,
    );
  }

  // The admin portal signs in with a password (signInWithPassword), so one has to
  // exist. It is generated rather than taken as an argument: workflow_dispatch
  // inputs are written to the run log verbatim and are never masked.
  const password = randomBytes(18).toString('base64url');

  const supabase = admin();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // no confirmation mail to chase; they can sign in at once
  });
  if (error || !data.user) fail(`could not create auth user: ${error?.message}`);

  const supabaseId = data.user.id;

  try {
    const profile = await prisma.profile.create({
      data: {
        supabaseId,
        email,
        firstName,
        lastName,
        gender,
        dateOfBirth,
        role,
        images: [],
      },
      select: { id: true, email: true, role: true },
    });

    console.log(`created ${profile.email} as ${profile.role} (${profile.id})`);
    console.log(`password: ${password}`);
  } catch (e) {
    // Otherwise the email is claimed by an auth user with no profile behind it,
    // and every retry fails on a duplicate that is invisible in the profiles table.
    await supabase.auth.admin.deleteUser(supabaseId);
    fail(`profile insert failed, auth user rolled back: ${(e as Error).message}`);
  }
}

async function setRole(argv: string[]) {
  const [emailRaw, roleRaw] = argv;
  if (!emailRaw) fail('usage: set-role <email> <ROLE>');

  const email = emailRaw.trim().toLowerCase();
  const role = parseRole(roleRaw ?? Role.SUPER_ADMIN, ALL_ROLES);

  const existing = await prisma.profile.findUnique({
    where: { email },
    select: { id: true, role: true, supabaseId: true },
  });

  if (!existing) {
    fail(
      `no profile for ${email}. If they signed up but never finished onboarding ` +
        'there is no row yet — either complete it, or use `create` instead.',
    );
  }

  // A profile with no supabaseId can never sign in: JwtAuthGuard resolves the
  // caller by that column. Granting a role to one produces staff who cannot log in.
  if (!existing.supabaseId) {
    fail(
      `${email} has no linked Supabase auth user, so it cannot sign in. This is a ` +
        'sample profile created by the portal, not a real account.',
    );
  }

  const updated = await prisma.profile.update({
    where: { email },
    data: { role },
    select: { id: true, email: true, role: true },
  });

  console.log(`${updated.email}: ${existing.role} → ${updated.role}`);
}

async function main() {
  const [command, ...argv] = process.argv.slice(2);

  switch (command) {
    case 'create':
      return create(argv);
    case 'set-role':
      return setRole(argv);
    default:
      fail(
        'usage: staff.ts create|set-role ... (see the comment at the top of this file)',
      );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
