import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Prisma, Profile, Role, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { assertAdult, computeProfileCompleted } from '../auth/auth.service';
import { AuditService, AUDIT_ACTIONS } from './audit.service';
import {
  AdminCreateUserDto,
  AdminUpdateUserDto,
  ListUsersDto,
  SetVerificationDto,
} from './dto/admin-user.dto';

/**
 * Columns the list view needs. The pre-existing listUsers returned whole rows,
 * which handed every moderator each member's home address and Supabase id;
 * anything private now has to be asked for explicitly on the detail route.
 */
const LIST_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  gender: true,
  dateOfBirth: true,
  role: true,
  avatarUrl: true,
  images: true,
  city: true,
  country: true,
  kujaNumber: true,
  isActive: true,
  isVerified: true,
  isDummy: true,
  verificationStatus: true,
  profileCompleted: true,
  createdAt: true,
  createdById: true,
} satisfies Prisma.ProfileSelect;

const DEFAULT_PAGE_SIZE = 25;

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async list(query: ListUsersDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const where = this.buildWhere(query);

    const [profiles, total] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        select: LIST_SELECT,
        orderBy: this.buildOrderBy(query.sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.profile.count({ where }),
    ]);

    this.logger.log(
      `list – returned ${profiles.length}/${total} (page ${page}, size ${pageSize})`,
    );

    return {
      profiles: await this.withCreatorNames(profiles),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async findOne(id: string) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Profile not found');

    const [staff, auditTrail, activity] = await Promise.all([
      this.resolveStaff([
        profile.createdById,
        profile.updatedById,
        profile.verifiedById,
      ]),
      this.audit.forTarget(id),
      this.relationshipCounts(id),
    ]);

    return {
      ...profile,
      createdBy: staff.get(profile.createdById ?? '') ?? null,
      updatedBy: staff.get(profile.updatedById ?? '') ?? null,
      verifiedBy: staff.get(profile.verifiedById ?? '') ?? null,
      activity,
      auditTrail,
    };
  }

  async create(actor: Profile, dto: AdminCreateUserDto) {
    assertAdult(dto.dateOfBirth);

    const existing = await this.prisma.profile.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('A profile with that email already exists');
    }

    // supabaseId stays null: a staff-created profile has no auth user and
    // cannot sign in. That is the point for sample profiles, and a real member
    // would sign up themselves.
    const { isDummy, dateOfBirth, ...rest } = dto;
    const data: Prisma.ProfileCreateInput = {
      ...rest,
      dateOfBirth: new Date(dateOfBirth),
      images: dto.images ?? [],
      isDummy: isDummy ?? false,
      createdById: actor.id,
      updatedById: actor.id,
    };

    const profile = await this.prisma.profile.create({
      data: {
        ...data,
        profileCompleted: computeProfileCompleted(data as Partial<Profile>),
      },
    });

    await this.audit.record(actor.id, AUDIT_ACTIONS.USER_CREATE, profile.id, {
      isDummy: profile.isDummy,
      email: profile.email,
    });

    this.logger.log(
      `create – id=${profile.id} isDummy=${profile.isDummy} by=${actor.id}`,
    );
    return profile;
  }

  async update(actor: Profile, id: string, dto: AdminUpdateUserDto) {
    const current = await this.prisma.profile.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Profile not found');

    if (dto.dateOfBirth) assertAdult(dto.dateOfBirth);

    if (dto.email && dto.email !== current.email) {
      const clash = await this.prisma.profile.findUnique({
        where: { email: dto.email },
      });
      if (clash) {
        throw new ConflictException('A profile with that email already exists');
      }
    }

    const { dateOfBirth, ...rest } = dto;
    const patch: Prisma.ProfileUpdateInput = {
      ...rest,
      ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
      updatedById: actor.id,
    };

    // profileCompleted is derived, so it has to be recomputed against the
    // merged result rather than the patch alone.
    const merged = { ...current, ...patch } as Partial<Profile>;

    const profile = await this.prisma.profile.update({
      where: { id },
      data: { ...patch, profileCompleted: computeProfileCompleted(merged) },
    });

    await this.audit.record(actor.id, AUDIT_ACTIONS.USER_UPDATE, id, {
      fields: Object.keys(dto),
    });

    this.logger.log(`update – id=${id} by=${actor.id}`);
    return profile;
  }

  async setVerification(actor: Profile, id: string, dto: SetVerificationDto) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Profile not found');

    if (
      dto.status === VerificationStatus.REJECTED &&
      !dto.rejectionReason?.trim()
    ) {
      throw new BadRequestException(
        'A reason is required when rejecting a profile',
      );
    }

    // Browse results filter on isVerified (users.service.ts), so the boolean
    // has to track the workflow state or a rejected profile stays visible.
    const isVerified = dto.status === VerificationStatus.VERIFIED;

    const updated = await this.prisma.profile.update({
      where: { id },
      data: {
        verificationStatus: dto.status,
        isVerified,
        rejectionReason:
          dto.status === VerificationStatus.REJECTED
            ? dto.rejectionReason!.trim()
            : null,
        verifiedAt: isVerified ? new Date() : null,
        verifiedById: actor.id,
      },
    });

    await this.audit.record(actor.id, AUDIT_ACTIONS.USER_VERIFY, id, {
      status: dto.status,
      ...(dto.rejectionReason && { reason: dto.rejectionReason }),
    });

    this.logger.log(
      `setVerification – id=${id} status=${dto.status} by=${actor.id}`,
    );
    return updated;
  }

  async setActive(actor: Profile, id: string, isActive: boolean) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Profile not found');

    if (profile.id === actor.id && !isActive) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    const updated = await this.prisma.profile.update({
      where: { id },
      data: { isActive },
    });

    await this.audit.record(actor.id, AUDIT_ACTIONS.USER_ACTIVE, id, {
      isActive,
    });
    this.logger.log(`setActive – id=${id} isActive=${isActive} by=${actor.id}`);
    return updated;
  }

  /**
   * Hard delete. Every foreign key into Profile is RESTRICT, so the dependents
   * have to go first or Postgres rejects the delete with P2003 — and they must
   * all go in one transaction so a failure halfway does not leave a member with
   * their history half-erased.
   */
  async remove(actor: Profile, id: string) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Profile not found');

    if (profile.id === actor.id) {
      throw new BadRequestException('You cannot delete your own account');
    }
    if (
      (profile.role === Role.ADMIN || profile.role === Role.SUPER_ADMIN) &&
      actor.role !== Role.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Only a super admin can delete an admin account',
      );
    }

    const pairFilter = {
      OR: [{ participant1Id: id }, { participant2Id: id }],
    };

    await this.prisma.$transaction(async (tx) => {
      const conversations = await tx.conversation.findMany({
        where: pairFilter,
        select: { id: true },
      });
      const conversationIds = conversations.map((c) => c.id);

      // Messages before conversations, and every message in a shared thread —
      // not just this member's — since the thread itself is going.
      if (conversationIds.length) {
        await tx.message.deleteMany({
          where: { conversationId: { in: conversationIds } },
        });
        await tx.conversation.deleteMany({
          where: { id: { in: conversationIds } },
        });
      }

      await tx.notification.deleteMany({
        where: { OR: [{ recipientId: id }, { actorId: id }] },
      });
      await tx.interest.deleteMany({
        where: { OR: [{ senderId: id }, { receiverId: id }] },
      });
      await tx.shortlist.deleteMany({
        where: { OR: [{ userId: id }, { targetId: id }] },
      });
      await tx.contactRequest.deleteMany({
        where: { OR: [{ requesterId: id }, { targetId: id }] },
      });
      await tx.profile.delete({ where: { id } });
    });

    await this.audit.record(actor.id, AUDIT_ACTIONS.USER_DELETE, id, {
      email: profile.email,
      name: `${profile.firstName} ${profile.lastName}`,
    });

    this.logger.log(`remove – id=${id} by=${actor.id}`);
    return { success: true };
  }

  // ---------------------------------------------------------------- helpers

  private buildWhere(query: ListUsersDto): Prisma.ProfileWhereInput {
    const where: Prisma.ProfileWhereInput = {};

    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { kujaNumber: { equals: q } },
        { city: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (query.role) where.role = query.role;
    if (query.gender) where.gender = query.gender;
    if (query.verificationStatus)
      where.verificationStatus = query.verificationStatus;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.isDummy !== undefined) where.isDummy = query.isDummy;
    if (query.profileCompleted !== undefined) {
      where.profileCompleted = query.profileCompleted;
    }
    if (query.createdById) where.createdById = query.createdById;

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {
        ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
        // dateTo is an inclusive day, so span to the end of it.
        ...(query.dateTo && { lt: endOfDay(query.dateTo) }),
      };
    }

    return where;
  }

  private buildOrderBy(
    sort: ListUsersDto['sort'],
  ): Prisma.ProfileOrderByWithRelationInput[] {
    if (sort === 'oldest') return [{ createdAt: 'asc' }];
    if (sort === 'name') return [{ firstName: 'asc' }, { lastName: 'asc' }];
    return [{ createdAt: 'desc' }];
  }

  private async relationshipCounts(id: string) {
    const [interestsSent, interestsReceived, conversations] = await Promise.all(
      [
        this.prisma.interest.count({ where: { senderId: id } }),
        this.prisma.interest.count({ where: { receiverId: id } }),
        this.prisma.conversation.count({
          where: { OR: [{ participant1Id: id }, { participant2Id: id }] },
        }),
      ],
    );
    return { interestsSent, interestsReceived, conversations };
  }

  /** createdById is a plain column, so creator names take one extra query. */
  private async withCreatorNames<T extends { createdById: string | null }>(
    rows: T[],
  ) {
    const staff = await this.resolveStaff(rows.map((r) => r.createdById));
    return rows.map((row) => ({
      ...row,
      createdBy: staff.get(row.createdById ?? '') ?? null,
    }));
  }

  private async resolveStaff(ids: (string | null | undefined)[]) {
    const unique = [...new Set(ids.filter((id): id is string => !!id))];
    if (!unique.length) return new Map<string, StaffRef>();

    const staff = await this.prisma.profile.findMany({
      where: { id: { in: unique } },
      select: { id: true, firstName: true, lastName: true, role: true },
    });
    return new Map(staff.map((s) => [s.id, s]));
  }
}

export interface StaffRef {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
}

function endOfDay(date: string): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
