import { Injectable, Logger } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ALL_PERMISSIONS, Permission } from './permissions';

/**
 * Resolves a role to its permission set.
 *
 * The matrix is editable at runtime, so it cannot be a constant — but hitting
 * the database on every guarded request would add a round-trip to every admin
 * call. The set is cached in memory and dropped whenever the roles endpoint
 * writes. A TTL backstops the case of a second API instance doing the writing.
 */
@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);
  private cache: Map<Role, Set<string>> | null = null;
  private loadedAt = 0;
  private inFlight: Promise<Map<Role, Set<string>>> | null = null;

  private static readonly TTL_MS = 60_000;

  constructor(private prisma: PrismaService) {}

  /** Call after any write to role_permissions. */
  invalidate() {
    this.cache = null;
    this.inFlight = null;
    this.logger.log('permission cache invalidated');
  }

  async permissionsFor(role: Role): Promise<Set<string>> {
    // A super admin is never locked out of their own portal, whatever the
    // matrix says — otherwise one bad save makes the roles screen unreachable.
    if (role === Role.SUPER_ADMIN) return new Set<string>(ALL_PERMISSIONS);

    const matrix = await this.load();
    return matrix.get(role) ?? new Set<string>();
  }

  async has(role: Role, permission: Permission): Promise<boolean> {
    return (await this.permissionsFor(role)).has(permission);
  }

  /** The whole matrix, for the Roles & Permissions screen. */
  async matrix(): Promise<Record<string, string[]>> {
    const loaded = await this.load();
    const out: Record<string, string[]> = {};
    for (const role of Object.values(Role)) {
      out[role] =
        role === Role.SUPER_ADMIN
          ? [...ALL_PERMISSIONS]
          : [...(loaded.get(role) ?? [])].sort();
    }
    return out;
  }

  private async load(): Promise<Map<Role, Set<string>>> {
    const fresh =
      this.cache && Date.now() - this.loadedAt < PermissionsService.TTL_MS;
    if (fresh) return this.cache!;

    // Concurrent requests on a cold cache share one query rather than
    // stampeding the database.
    if (this.inFlight) return this.inFlight;

    this.inFlight = this.prisma.rolePermission
      .findMany({ select: { role: true, permission: true } })
      .then((rows) => {
        const map = new Map<Role, Set<string>>();
        for (const row of rows) {
          const set = map.get(row.role) ?? new Set<string>();
          set.add(row.permission);
          map.set(row.role, set);
        }
        this.cache = map;
        this.loadedAt = Date.now();
        this.inFlight = null;
        this.logger.log(`permission matrix loaded – ${rows.length} grant(s)`);
        return map;
      })
      .catch((err) => {
        this.inFlight = null;
        throw err;
      });

    return this.inFlight;
  }
}
