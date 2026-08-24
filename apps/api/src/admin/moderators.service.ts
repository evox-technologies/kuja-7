import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Prisma, Profile, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { assertAdult } from '../auth/auth.service';
import { AuditService, AUDIT_ACTIONS } from './audit.service';
import { SupabaseAdminService } from './supabase-admin.service';
import {
  ActivityQueryDto,
  CreateModeratorDto,
  UpdateModeratorDto,
} from './dto/moderator.dto';

const STAFF_ROLES: Role[] = [Role.MODERATOR, Role.ADMIN, Role.SUPER_ADMIN];

/** How far back the activity chart looks when no range is given. */
const DEFAULT_ACTIVITY_DAYS = 30;

export interface DailyCount {
  moderatorId: string;
  day: string;
  count: number;
}

@Injectable()
export class ModeratorsService {
  private readonly logger = new Logger(ModeratorsService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private supabase: SupabaseAdminService,
  ) {}

  async list() {
    const staff = await this.prisma.profile.findMany({
      where: { role: { in: STAFF_ROLES } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        supabaseId: true,
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });

    const ids = staff.map((s) => s.id);
    const [created, edited] = await Promise.all([
      this.createdTotals(ids),
      this.editedTotals(ids),
    ]);

    return staff.map(({ supabaseId, ...member }) => ({
      ...member,
      // Never leak the Supabase id; the screen only needs to know whether the
      // account can actually sign in.
      canSignIn: !!supabaseId,
      profilesCreated: created.get(member.id) ?? 0,
      profilesEdited: edited.get(member.id) ?? 0,
    }));
  }

  async create(actor: Profile, dto: CreateModeratorDto) {
    const role = dto.role ?? Role.MODERATOR;
    this.assertMayGrant(actor, role);
    assertAdult(dto.dateOfBirth);

    const existing = await this.prisma.profile.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('A profile with that email already exists');
    }

    // The auth user has to exist first — a moderator who cannot sign in is
    // useless. If the profile insert then fails we undo it rather than leave
    // the email claimed by an account with no profile behind it.
    const supabaseId = await this.supabase.createUser(dto.email, dto.password);

    try {
      const profile = await this.prisma.profile.create({
        data: {
          supabaseId,
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          gender: dto.gender,
          dateOfBirth: new Date(dto.dateOfBirth),
          role,
          createdById: actor.id,
          images: [],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      await this.audit.record(
        actor.id,
        AUDIT_ACTIONS.MODERATOR_CREATE,
        profile.id,
        { email: profile.email, role },
      );

      this.logger.log(`create – id=${profile.id} role=${role} by=${actor.id}`);
      return {
        ...profile,
        canSignIn: true,
        profilesCreated: 0,
        profilesEdited: 0,
      };
    } catch (err) {
      await this.supabase.deleteUser(supabaseId);
      throw err;
    }
  }

  async update(actor: Profile, id: string, dto: UpdateModeratorDto) {
    const target = await this.prisma.profile.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Profile not found');

    if (dto.role) this.assertMayGrant(actor, dto.role);
    this.assertMayEdit(actor, target);

    if (target.id === actor.id && dto.isActive === false) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    const updated = await this.prisma.profile.update({
      where: { id },
      data: {
        ...(dto.role && { role: dto.role }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await this.audit.record(actor.id, AUDIT_ACTIONS.MODERATOR_UPDATE, id, {
      ...(dto.role && { role: dto.role }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });

    this.logger.log(`update – id=${id} by=${actor.id}`);
    return updated;
  }

  async resetPassword(actor: Profile, id: string, password: string) {
    const target = await this.prisma.profile.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Profile not found');
    this.assertMayEdit(actor, target);

    if (!target.supabaseId) {
      throw new BadRequestException(
        'This profile has no sign-in account, so it has no password to reset',
      );
    }

    await this.supabase.setPassword(target.supabaseId, password);
    await this.audit.record(
      actor.id,
      AUDIT_ACTIONS.MODERATOR_RESET_PASSWORD,
      id,
    );

    this.logger.log(`resetPassword – id=${id} by=${actor.id}`);
    return { success: true };
  }

  /**
   * Per-day created and edited counts for every staff member, which is what
   * "Moderator A → 125 profiles created → 83 profiles edited" is built from.
   */
  async activity(query: ActivityQueryDto) {
    const to = query.to
      ? endOfDay(query.to)
      : endOfDay(new Date().toISOString());
    const from = query.from
      ? startOfDay(query.from)
      : startOfDay(daysAgo(DEFAULT_ACTIVITY_DAYS).toISOString());

    if (from > to) {
      throw new BadRequestException('`from` must be on or before `to`');
    }

    const [created, edited, staff] = await Promise.all([
      this.createdByDay(from, to),
      this.editedByDay(from, to),
      this.prisma.profile.findMany({
        where: { role: { in: STAFF_ROLES } },
        select: { id: true, firstName: true, lastName: true, role: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      days: eachDay(from, to),
      moderators: staff.map((member) => ({
        ...member,
        created: created.filter((row) => row.moderatorId === member.id),
        edited: edited.filter((row) => row.moderatorId === member.id),
        totalCreated: sum(created, member.id),
        totalEdited: sum(edited, member.id),
      })),
    };
  }

  // ---------------------------------------------------------------- helpers

  /**
   * Only a super admin may mint or promote to admin-level roles — otherwise an
   * admin could quietly grant themselves a peer who can remove them.
   */
  private assertMayGrant(actor: Profile, role: Role) {
    if (!STAFF_ROLES.includes(role)) {
      throw new BadRequestException(`${role} is not a staff role`);
    }
    if (
      (role === Role.ADMIN || role === Role.SUPER_ADMIN) &&
      actor.role !== Role.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Only a super admin can grant admin-level roles',
      );
    }
  }

  private assertMayEdit(actor: Profile, target: Profile) {
    if (
      (target.role === Role.ADMIN || target.role === Role.SUPER_ADMIN) &&
      actor.role !== Role.SUPER_ADMIN &&
      target.id !== actor.id
    ) {
      throw new ForbiddenException(
        'Only a super admin can modify an admin account',
      );
    }
  }

  private async createdTotals(ids: string[]): Promise<Map<string, number>> {
    if (!ids.length) return new Map();
    const rows = await this.prisma.profile.groupBy({
      by: ['createdById'],
      where: { createdById: { in: ids } },
      _count: { _all: true },
    });
    return new Map(rows.map((r) => [r.createdById as string, r._count._all]));
  }

  private async editedTotals(ids: string[]): Promise<Map<string, number>> {
    if (!ids.length) return new Map();
    const rows = await this.prisma.adminAuditLog.groupBy({
      by: ['actorId'],
      where: { actorId: { in: ids }, action: AUDIT_ACTIONS.USER_UPDATE },
      _count: { _all: true },
    });
    return new Map(rows.map((r) => [r.actorId, r._count._all]));
  }

  /**
   * Raw SQL because Prisma's groupBy cannot bucket a timestamp by day. Both
   * queries are parameterised.
   */
  private async createdByDay(from: Date, to: Date): Promise<DailyCount[]> {
    const rows = await this.prisma.$queryRaw<
      { moderatorId: string; day: Date; count: bigint }[]
    >(Prisma.sql`
      SELECT "createdById" AS "moderatorId",
             date_trunc('day', "createdAt") AS day,
             COUNT(*) AS count
      FROM "profiles"
      WHERE "createdById" IS NOT NULL
        AND "createdAt" >= ${from}
        AND "createdAt" <= ${to}
      GROUP BY 1, 2
      ORDER BY 2 ASC
    `);
    return rows.map(toDailyCount);
  }

  private async editedByDay(from: Date, to: Date): Promise<DailyCount[]> {
    const rows = await this.prisma.$queryRaw<
      { moderatorId: string; day: Date; count: bigint }[]
    >(Prisma.sql`
      SELECT "actorId" AS "moderatorId",
             date_trunc('day', "createdAt") AS day,
             COUNT(*) AS count
      FROM "admin_audit_logs"
      WHERE "action" = ${AUDIT_ACTIONS.USER_UPDATE}
        AND "createdAt" >= ${from}
        AND "createdAt" <= ${to}
      GROUP BY 1, 2
      ORDER BY 2 ASC
    `);
    return rows.map(toDailyCount);
  }
}

// COUNT(*) comes back as a bigint, which JSON.stringify refuses to serialise.
function toDailyCount(row: {
  moderatorId: string;
  day: Date;
  count: bigint;
}): DailyCount {
  return {
    moderatorId: row.moderatorId,
    day: isoDay(row.day),
    count: Number(row.count),
  };
}

function sum(rows: DailyCount[], moderatorId: string): number {
  return rows
    .filter((r) => r.moderatorId === moderatorId)
    .reduce((total, r) => total + r.count, 0);
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfDay(iso: string): Date {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(iso: string): Date {
  const d = new Date(iso);
  d.setHours(23, 59, 59, 999);
  return d;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/** Every day in range, so the chart shows zeroes rather than skipping days. */
function eachDay(from: Date, to: Date): string[] {
  const days: string[] = [];
  const cursor = startOfDay(from.toISOString());
  while (cursor <= to) {
    days.push(isoDay(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}
