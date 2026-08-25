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
import WebSocket from 'ws';

// realtime-js resolves a WebSocket constructor inside `new SupabaseClient`, not on
// first subscribe, and Node 20 has no global one — so without this every call here
// dies before it reaches Supabase at all. `ws`'s types don't structurally match the
// DOM lib types realtime-js expects, though they are functionally compatible.
const wsTransport: any = WebSocket;

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
    realtime: { transport: wsTransport },
  });
}

function linkOptionsFor(email: string) {
  const site = process.env.FRONTEND_URL?.replace(/\/$/, '');
  return {
    type: 'recovery' as const,
    email,
    ...(site && { options: { redirectTo: `${site}/reset-password/` } }),
  };
}

/**
 * Reissues a sign-in link. Recovery links are single-use, and `create` refuses
 * once a profile exists, so without this a staff member who lost or burned their
 * link had no way back in short of deleting and recreating the account.
 */
async function resetLink(argv: string[]) {
  const [emailRaw] = argv;
  if (!emailRaw) fail('usage: reset-link <email>');
  const email = emailRaw.trim().toLowerCase();

  const profile = await prisma.profile.findUnique({
    where: { email },
    select: { role: true, supabaseId: true },
  });
  if (!profile) fail(`no profile for ${email}`);
  if (!profile.supabaseId) {
    fail(`${email} has no linked auth user, so it cannot sign in at all`);
  }

  const supabase = admin();
  const { data, error } = await supabase.auth.admin.generateLink(
    linkOptionsFor(email),
  );
  if (error || !data?.properties?.action_link) {
    fail(`could not generate a link: ${error?.message}`);
  }

  // Drift between these two is invisible until someone tries to sign in and gets
  // "User from sub claim in JWT does not exist" — worth naming when it happens.
  if (data.user?.id !== profile.supabaseId) {
    console.log(
      `warning: profile.supabaseId is ${profile.supabaseId} but the auth user is ` +
        `${data.user?.id}. The profile points at an account that no longer exists.`,
    );
  }

  console.log(`recovery link for ${email} (${profile.role}):`);
  console.log(data.properties.action_link);
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

  // The portal signs in with signInWithPassword, so a password has to exist — but
  // this one is never disclosed to anyone, including the operator. Access comes
  // from the single-use recovery link printed below, so the password the account
  // ends up with was never written down anywhere.
  const password = randomBytes(18).toString('base64url');

  const supabase = admin();
  const linkOptions = linkOptionsFor(email);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // no confirmation mail to chase; they can sign in at once
  });

  let supabaseId: string;
  let adopted = false;
  let actionLink = '';

  if (data?.user) {
    supabaseId = data.user.id;
  } else {
    // Almost always "already registered": someone signed up and abandoned
    // onboarding, leaving an auth user with no profile. set-role cannot help
    // (no row to update) and create used to dead-end here, so the account was
    // unreachable by the one tool meant for exactly this. Adopt it instead.
    //
    // generateLink is the probe as well as the fix — it resolves the existing
    // user without paging listUsers, and returns the link needed anyway.
    const { data: link, error: linkError } =
      await supabase.auth.admin.generateLink(linkOptions);

    if (linkError || !link?.user) {
      fail(`could not create auth user: ${error?.message}`);
    }

    supabaseId = link.user.id;
    actionLink = link.properties?.action_link ?? '';
    adopted = true;
    console.log(`adopting the existing auth user for ${email}`);
  }

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

    // A recovery link rather than the password itself. Run logs are readable by
    // anyone with repo *read* access — a wider set than the write access needed to
    // dispatch this — and they persist for 90 days. This link is single-use and
    // expires, and whatever password they choose through it is never logged.
    if (!actionLink) {
      const { data: link, error: linkError } =
        await supabase.auth.admin.generateLink(linkOptions);

      if (linkError || !link?.properties?.action_link) {
        console.log(
          `account created, but the recovery link failed: ${linkError?.message}. ` +
            'Use "Forgot password" on the sign-in page to set one.',
        );
        return;
      }
      actionLink = link.properties.action_link;
    }

    console.log('set the password with this single-use link:');
    console.log(actionLink);
  } catch (e) {
    // Roll back only what this run created. Deleting an adopted user would
    // destroy a real person's account — and their Supabase identity, sessions and
    // any linked OAuth — because a profile insert failed.
    if (adopted) {
      fail(
        `profile insert failed for the existing auth user, which was left alone: ${(e as Error).message}`,
      );
    }
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
    case 'reset-link':
      return resetLink(argv);
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
