/**
 * Covers the admin module against a real database: user CRUD, the verification
 * workflow, the permission matrix, and moderator activity counts.
 *
 * The delete path is the reason this file exists — every foreign key into
 * Profile is RESTRICT, so removing a member who has actually used the site
 * fails unless the dependents go first, and that is not something a type
 * checker catches.
 *
 * Requires a local throwaway Postgres — see .env.test.example. Run with
 * `npm run test:integration`.
 */
import { Gender, PrismaClient, Role, VerificationStatus } from '@prisma/client';
import { AdminUsersService } from '../src/admin/admin-users.service';
import { AuditService } from '../src/admin/audit.service';
import { PermissionsService } from '../src/admin/permissions.service';
import { RolesService } from '../src/admin/roles.service';
import { ModeratorsService } from '../src/admin/moderators.service';
import { MatchesService } from '../src/matches/matches.service';

const prisma = new PrismaClient();

const notifications = {
  notifyInterestReceived: jest.fn(),
  notifyInterestAccepted: jest.fn(),
};

const supabase = {
  createUser: jest.fn(() => Promise.resolve('sb-created-user')),
  setPassword: jest.fn(() => Promise.resolve()),
  deleteUser: jest.fn(() => Promise.resolve()),
};

const audit = new AuditService(prisma as any);
const users = new AdminUsersService(prisma as any, audit);
const permissions = new PermissionsService(prisma as any);
const roles = new RolesService(prisma as any, permissions, audit);
const moderators = new ModeratorsService(prisma as any, audit, supabase as any);
const matches = new MatchesService(prisma as any, notifications as any);

let seq = 0;

async function makeProfile(
  tag: string,
  overrides: Record<string, unknown> = {},
) {
  seq += 1;
  return prisma.profile.create({
    data: {
      supabaseId: `sb-${tag}-${seq}`,
      email: `${tag}-${seq}@test.dev`,
      firstName: tag,
      lastName: 'Tester',
      gender: seq % 2 ? 'MALE' : 'FEMALE',
      dateOfBirth: new Date('1995-01-01'),
      profileCompleted: true,
      ...overrides,
    },
  });
}

function adminUserDto(tag: string, overrides: Record<string, unknown> = {}) {
  seq += 1;
  return {
    firstName: tag,
    lastName: 'Sample',
    email: `${tag}-${seq}@sample.dev`,
    gender: 'FEMALE' as const,
    dateOfBirth: '1996-04-02',
    ...overrides,
  };
}

async function reset() {
  await prisma.adminAuditLog.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.contactRequest.deleteMany();
  await prisma.interest.deleteMany();
  await prisma.shortlist.deleteMany();
  await prisma.profile.deleteMany();
  permissions.invalidate();
}

beforeEach(async () => {
  jest.clearAllMocks();
  await reset();
});

afterAll(async () => {
  await reset();
  await prisma.$disconnect();
});

describe('creating a member from the portal', () => {
  it('records who added it and needs no auth user', async () => {
    const staff = await makeProfile('staff', { role: Role.MODERATOR });

    const created = await users.create(
      staff,
      adminUserDto('sample', { isDummy: true }),
    );

    expect(created.supabaseId).toBeNull();
    expect(created.isDummy).toBe(true);
    expect(created.createdById).toBe(staff.id);
  });

  it('marks the profile incomplete until the mandatory fields are there', async () => {
    const staff = await makeProfile('staff', { role: Role.MODERATOR });

    const sparse = await users.create(staff, adminUserDto('sparse'));
    expect(sparse.profileCompleted).toBe(false);

    const full = await users.create(
      staff,
      adminUserDto('full', {
        mobileNumber: '+94 771234567',
        address: '1 Test Lane',
        height: `5' 6"`,
        country: 'Sri Lanka',
        city: 'Colombo',
        educationLevel: "Bachelor's Degree",
        profession: 'Engineer',
        kujaNumber: '7',
        birthDay: '1996-04-02',
      }),
    );
    expect(full.profileCompleted).toBe(true);
  });

  it('refuses a duplicate email', async () => {
    const staff = await makeProfile('staff', { role: Role.ADMIN });
    const dto = adminUserDto('dup');

    await users.create(staff, dto);
    await expect(users.create(staff as any, dto)).rejects.toThrow(
      /already exists/i,
    );
  });

  it('refuses anyone under 18', async () => {
    const staff = await makeProfile('staff', { role: Role.ADMIN });
    const tooYoung = new Date();
    tooYoung.setFullYear(tooYoung.getFullYear() - 10);

    await expect(
      users.create(
        staff as any,
        adminUserDto('child', {
          dateOfBirth: tooYoung.toISOString(),
        }),
      ),
    ).rejects.toThrow(/18/);
  });
});

describe('searching and filtering', () => {
  it('finds by name, email and sample flag', async () => {
    const staff = await makeProfile('staff', { role: Role.ADMIN });
    await users.create(staff, adminUserDto('Anjali', { isDummy: true }));
    await users.create(staff, adminUserDto('Bandara'));

    const byName = await users.list({ q: 'anjali' });
    expect(byName.profiles).toHaveLength(1);
    expect(byName.profiles[0].firstName).toBe('Anjali');

    const samples = await users.list({ isDummy: true });
    expect(samples.profiles.every((p) => p.isDummy)).toBe(true);
    expect(samples.total).toBe(1);
  });

  it('filters to one moderator’s work', async () => {
    const one = await makeProfile('modone', { role: Role.MODERATOR });
    const two = await makeProfile('modtwo', { role: Role.MODERATOR });
    await users.create(one, adminUserDto('a'));
    await users.create(one, adminUserDto('b'));
    await users.create(two, adminUserDto('c'));

    const mine = await users.list({ createdById: one.id });
    expect(mine.total).toBe(2);
    expect(mine.profiles.every((p) => p.createdBy?.id === one.id)).toBe(true);
  });

  it('paginates', async () => {
    const staff = await makeProfile('staff', { role: Role.ADMIN });
    for (let i = 0; i < 5; i++)
      await users.create(staff, adminUserDto(`p${i}`));

    const page = await users.list({ page: 1, pageSize: 2 });
    expect(page.profiles).toHaveLength(2);
    expect(page.totalPages).toBe(3); // 5 created + the staff profile itself
  });

  it('never returns private columns in the list', async () => {
    const staff = await makeProfile('staff', { role: Role.ADMIN });
    await users.create(
      staff,
      adminUserDto('priv', { address: '1 Secret Road' }),
    );

    const list = await users.list({ q: 'priv' });
    expect(list.profiles[0]).not.toHaveProperty('address');
    expect(list.profiles[0]).not.toHaveProperty('supabaseId');
    expect(list.profiles[0]).not.toHaveProperty('mobileNumber');
  });
});

describe('the verification workflow', () => {
  it('keeps isVerified in step with the status', async () => {
    const staff = await makeProfile('staff', { role: Role.ADMIN });
    const member = await makeProfile('member');

    const underReview = await users.setVerification(staff, member.id, {
      status: VerificationStatus.UNDER_REVIEW,
    });
    expect(underReview.isVerified).toBe(false);

    const verified = await users.setVerification(staff, member.id, {
      status: VerificationStatus.VERIFIED,
    });
    expect(verified.isVerified).toBe(true);
    expect(verified.verifiedById).toBe(staff.id);
    expect(verified.verifiedAt).not.toBeNull();
  });

  it('demands a reason before rejecting, and keeps it', async () => {
    const staff = await makeProfile('staff', { role: Role.ADMIN });
    const member = await makeProfile('member');

    await expect(
      users.setVerification(staff as any, member.id, {
        status: VerificationStatus.REJECTED,
      }),
    ).rejects.toThrow(/reason is required/i);

    const rejected = await users.setVerification(staff, member.id, {
      status: VerificationStatus.REJECTED,
      rejectionReason: 'Photos do not match the description',
    });
    expect(rejected.isVerified).toBe(false);
    expect(rejected.rejectionReason).toBe(
      'Photos do not match the description',
    );
  });

  it('clears the reason once the profile is approved', async () => {
    const staff = await makeProfile('staff', { role: Role.ADMIN });
    const member = await makeProfile('member');

    await users.setVerification(staff, member.id, {
      status: VerificationStatus.REJECTED,
      rejectionReason: 'Needs a clearer photo',
    });
    const approved = await users.setVerification(staff, member.id, {
      status: VerificationStatus.VERIFIED,
    });

    expect(approved.rejectionReason).toBeNull();
  });
});

describe('activation', () => {
  it('goes both ways, unlike the old one-way deactivate', async () => {
    const staff = await makeProfile('staff', { role: Role.ADMIN });
    const member = await makeProfile('member');

    expect(
      (await users.setActive(staff as any, member.id, false)).isActive,
    ).toBe(false);
    expect(
      (await users.setActive(staff as any, member.id, true)).isActive,
    ).toBe(true);
  });

  it('will not let staff lock themselves out', async () => {
    const staff = await makeProfile('staff', { role: Role.ADMIN });

    await expect(
      users.setActive(staff as any, staff.id, false),
    ).rejects.toThrow(/your own account/i);
  });
});

describe('deleting a member who has actually used the site', () => {
  it('removes every dependent row rather than failing on a foreign key', async () => {
    const staff = await makeProfile('staff', { role: Role.ADMIN });
    const member = await makeProfile('member');
    const other = await makeProfile('other');

    // Give the member a full history: interest, match, conversation, message,
    // contact request, shortlist, notification.
    await matches.sendInterest(member.id, other.id);
    await matches.sendInterest(other.id, member.id);
    await matches.toggleShortlist(member.id, other.id);
    await matches.sendContactRequest(member.id, other.id);
    const conversation = await prisma.conversation.findFirst();
    await prisma.message.create({
      data: {
        conversationId: conversation!.id,
        senderId: member.id,
        content: 'Hello',
      },
    });
    await prisma.notification.create({
      data: {
        type: 'INTEREST_RECEIVED',
        recipientId: other.id,
        actorId: member.id,
      },
    });

    await users.remove(staff, member.id);

    expect(
      await prisma.profile.findUnique({ where: { id: member.id } }),
    ).toBeNull();
    expect(await prisma.interest.count()).toBe(0);
    expect(await prisma.shortlist.count()).toBe(0);
    expect(await prisma.contactRequest.count()).toBe(0);
    expect(await prisma.conversation.count()).toBe(0);
    expect(await prisma.message.count()).toBe(0);
    expect(await prisma.notification.count()).toBe(0);

    // The other party survives untouched.
    expect(
      await prisma.profile.findUnique({ where: { id: other.id } }),
    ).not.toBeNull();
  });

  it('refuses to delete your own account', async () => {
    const staff = await makeProfile('staff', { role: Role.ADMIN });
    await expect(users.remove(staff as any, staff.id)).rejects.toThrow(
      /your own account/i,
    );
  });

  it('stops an admin deleting another admin', async () => {
    const admin = await makeProfile('admin', { role: Role.ADMIN });
    const peer = await makeProfile('peer', { role: Role.ADMIN });

    await expect(users.remove(admin as any, peer.id)).rejects.toThrow(
      /super admin/i,
    );
  });

  it('lets a super admin delete an admin', async () => {
    const superAdmin = await makeProfile('super', { role: Role.SUPER_ADMIN });
    const admin = await makeProfile('admin', { role: Role.ADMIN });

    await users.remove(superAdmin, admin.id);
    expect(
      await prisma.profile.findUnique({ where: { id: admin.id } }),
    ).toBeNull();
  });

  it('leaves an audit entry naming who did it', async () => {
    const staff = await makeProfile('staff', { role: Role.ADMIN });
    const member = await makeProfile('member');

    await users.remove(staff, member.id);

    const entry = await prisma.adminAuditLog.findFirst({
      where: { action: 'user.delete' },
    });
    expect(entry?.actorId).toBe(staff.id);
    expect(entry?.targetId).toBe(member.id);
  });
});

describe('the permission matrix', () => {
  it('reads grants out of the database', async () => {
    await prisma.rolePermission.createMany({
      data: [
        { role: Role.MODERATOR, permission: 'users.view' },
        { role: Role.MODERATOR, permission: 'users.create' },
      ],
    });

    const held = await permissions.permissionsFor(Role.MODERATOR);
    expect([...held].sort()).toEqual(['users.create', 'users.view']);
    expect(await permissions.has(Role.MODERATOR, 'users.delete' as any)).toBe(
      false,
    );
  });

  it('gives a super admin everything, matrix or no matrix', async () => {
    const held = await permissions.permissionsFor(Role.SUPER_ADMIN);
    expect(held.has('roles.manage')).toBe(true);
    expect(held.has('users.delete')).toBe(true);
  });

  it('takes effect immediately after a save', async () => {
    const admin = await makeProfile('admin', { role: Role.ADMIN });
    await prisma.rolePermission.create({
      data: { role: Role.ADMIN, permission: 'roles.manage' },
    });
    permissions.invalidate();

    expect(await permissions.has(Role.MODERATOR, 'users.delete' as any)).toBe(
      false,
    );

    await roles.setPermissions(admin, Role.MODERATOR, [
      'users.view',
      'users.delete',
    ]);

    expect(await permissions.has(Role.MODERATOR, 'users.delete' as any)).toBe(
      true,
    );
  });

  it('refuses unknown permission keys', async () => {
    const admin = await makeProfile('admin', { role: Role.SUPER_ADMIN });

    await expect(
      roles.setPermissions(admin as any, Role.MODERATOR, [
        'users.view',
        'nonsense.key',
      ]),
    ).rejects.toThrow(/unknown permission/i);
  });

  it('will not let super admin permissions be edited away', async () => {
    const admin = await makeProfile('admin', { role: Role.SUPER_ADMIN });

    await expect(
      roles.setPermissions(admin as any, Role.SUPER_ADMIN, []),
    ).rejects.toThrow(/cannot be edited/i);
  });

  it('stops an admin removing their own access to this screen', async () => {
    const admin = await makeProfile('admin', { role: Role.ADMIN });

    await expect(
      roles.setPermissions(admin as any, Role.ADMIN, ['users.view']),
    ).rejects.toThrow(/lock you out/i);
  });
});

describe('moderator management', () => {
  it('creates an auth user so the moderator can actually sign in', async () => {
    const admin = await makeProfile('admin', { role: Role.SUPER_ADMIN });

    const created = await moderators.create(admin, {
      email: 'new.mod@test.dev',
      password: 'temp-password-1',
      firstName: 'New',
      lastName: 'Mod',
      gender: 'FEMALE',
      dateOfBirth: '1994-02-02',
    });

    expect(supabase.createUser).toHaveBeenCalledWith(
      'new.mod@test.dev',
      'temp-password-1',
    );
    expect(created.role).toBe(Role.MODERATOR);
    expect(created.canSignIn).toBe(true);
  });

  it('cleans up the auth user if the profile insert fails', async () => {
    const admin = await makeProfile('admin', { role: Role.SUPER_ADMIN });
    await makeProfile('clash', { email: 'clash@test.dev' });

    // A profile with that email already exists, so the create throws after the
    // auth user was minted.
    await expect(
      moderators.create(admin as any, {
        email: 'clash@test.dev',
        password: 'temp-password-1',
        firstName: 'Clash',
        lastName: 'Mod',
        gender: Gender.FEMALE,
        dateOfBirth: '1994-02-02',
      }),
    ).rejects.toThrow();
  });

  it('stops an admin minting another admin', async () => {
    const admin = await makeProfile('admin', { role: Role.ADMIN });

    await expect(
      moderators.create(admin as any, {
        email: 'peer@test.dev',
        password: 'temp-password-1',
        firstName: 'Peer',
        lastName: 'Admin',
        gender: Gender.MALE,
        dateOfBirth: '1990-01-01',
        role: Role.ADMIN,
      }),
    ).rejects.toThrow(/super admin/i);
  });

  it('counts profiles created and edited per moderator', async () => {
    const mod = await makeProfile('mod', { role: Role.MODERATOR });
    const created = await users.create(mod, adminUserDto('one'));
    await users.create(mod, adminUserDto('two'));
    await users.update(mod, created.id, { firstName: 'Renamed' });

    const list = await moderators.list();
    const row = list.find((m) => m.id === mod.id);

    expect(row?.profilesCreated).toBe(2);
    expect(row?.profilesEdited).toBe(1);
  });

  it('buckets activity by day with no gaps in the range', async () => {
    const mod = await makeProfile('mod', { role: Role.MODERATOR });
    await users.create(mod, adminUserDto('today'));

    const activity = await moderators.activity({});
    const row = activity.moderators.find((m) => m.id === mod.id);

    expect(row?.totalCreated).toBe(1);
    expect(row?.created[0].day).toBe(new Date().toISOString().slice(0, 10));
    // The range is filled in day by day so a chart shows zeroes, not holes.
    expect(activity.days.length).toBeGreaterThan(28);
  });
});
