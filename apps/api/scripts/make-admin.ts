/**
 * Promotes an existing profile to a staff role.
 *
 * Nothing in the application can create the first admin — role is never written
 * by any endpoint — so this is the one manual step before the portal is
 * reachable. Run it once against the target database:
 *
 *   pnpm --filter api exec ts-node scripts/make-admin.ts you@example.com
 *   pnpm --filter api exec ts-node scripts/make-admin.ts them@example.com ADMIN
 *
 * The person must have signed up through the site first, so that a profile and
 * a Supabase auth user already exist to promote.
 */
import { PrismaClient, Role } from '@prisma/client';

const STAFF_ROLES: Role[] = [Role.MODERATOR, Role.ADMIN, Role.SUPER_ADMIN];

async function main() {
  const [email, roleArg] = process.argv.slice(2);

  if (!email) {
    console.error('Usage: ts-node scripts/make-admin.ts <email> [role]');
    console.error(`role is one of ${STAFF_ROLES.join(' | ')} (default SUPER_ADMIN)`);
    process.exit(1);
  }

  const role = (roleArg as Role) ?? Role.SUPER_ADMIN;
  if (!STAFF_ROLES.includes(role)) {
    console.error(`"${role}" is not a staff role. Use one of ${STAFF_ROLES.join(', ')}.`);
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const profile = await prisma.profile.findUnique({ where: { email } });
    if (!profile) {
      console.error(
        `No profile with email "${email}". Sign up through the site first, then re-run this.`,
      );
      process.exit(1);
    }

    if (!profile.supabaseId) {
      console.error(
        `"${email}" has no sign-in account, so it could never reach the portal. ` +
          'Staff accounts need a Supabase auth user — create this one from the Moderators screen instead.',
      );
      process.exit(1);
    }

    const updated = await prisma.profile.update({
      where: { email },
      data: { role, isActive: true },
    });

    console.log(
      `${updated.firstName} ${updated.lastName} <${updated.email}> is now ${updated.role}.`,
    );
    console.log('Sign in at /admin to reach the portal.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
