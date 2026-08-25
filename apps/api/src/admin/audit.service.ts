import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const AUDIT_ACTIONS = {
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_VERIFY: 'user.verify',
  USER_ACTIVE: 'user.active',
  MODERATOR_CREATE: 'moderator.create',
  MODERATOR_UPDATE: 'moderator.update',
  MODERATOR_RESET_PASSWORD: 'moderator.resetPassword',
  ROLE_PERMISSIONS_UPDATE: 'role.permissions.update',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Records a staff action. Never throws: an audit write failing must not roll
   * back the action the user actually asked for, and the same line is on
   * stdout regardless.
   */
  async record(
    actorId: string,
    action: AuditAction,
    targetId?: string | null,
    meta?: Prisma.InputJsonValue,
  ): Promise<void> {
    this.logger.log(
      `${action} – actorId=${actorId}${targetId ? ` targetId=${targetId}` : ''}`,
    );
    try {
      await this.prisma.adminAuditLog.create({
        data: { actorId, action, targetId: targetId ?? null, meta },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`audit write failed for ${action}: ${message}`);
    }
  }

  /** Recent entries for one profile, newest first — shown on the user detail screen. */
  async forTarget(targetId: string, take = 20) {
    const entries = await this.prisma.adminAuditLog.findMany({
      where: { targetId },
      orderBy: { createdAt: 'desc' },
      take,
    });
    return this.withActorNames(entries);
  }

  async forActor(actorId: string, take = 50) {
    const entries = await this.prisma.adminAuditLog.findMany({
      where: { actorId },
      orderBy: { createdAt: 'desc' },
      take,
    });
    return this.withActorNames(entries);
  }

  /**
   * actorId is a plain column rather than a relation (see schema.prisma), so
   * names are resolved here in one extra query.
   */
  private async withActorNames<T extends { actorId: string }>(entries: T[]) {
    if (!entries.length) return [];
    const actors = await this.prisma.profile.findMany({
      where: { id: { in: [...new Set(entries.map((e) => e.actorId))] } },
      select: { id: true, firstName: true, lastName: true, role: true },
    });
    const byId = new Map(actors.map((a) => [a.id, a]));
    return entries.map((entry) => ({
      ...entry,
      actor: byId.get(entry.actorId) ?? null,
    }));
  }
}
