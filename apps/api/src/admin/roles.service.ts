import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Profile, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService, AUDIT_ACTIONS } from './audit.service';
import { PermissionsService } from './permissions.service';
import {
  ALL_PERMISSIONS,
  PERMISSION_CATALOGUE,
  isPermission,
} from './permissions';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsService,
    private audit: AuditService,
  ) {}

  async matrix() {
    const granted = await this.permissions.matrix();
    return {
      catalogue: PERMISSION_CATALOGUE,
      roles: Object.values(Role).map((role) => ({
        role,
        permissions: granted[role] ?? [],
        // The super admin set is fixed in code so the portal cannot be locked
        // out of itself; the UI renders that column read-only.
        locked: role === Role.SUPER_ADMIN,
        // USER is every member; it is shown for completeness but holds nothing.
        editable: role !== Role.SUPER_ADMIN,
      })),
    };
  }

  async setPermissions(actor: Profile, role: Role, permissions: string[]) {
    if (role === Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Super admin permissions are fixed and cannot be edited',
      );
    }

    const unknown = permissions.filter((p) => !isPermission(p));
    if (unknown.length) {
      throw new BadRequestException(
        `Unknown permission: ${unknown.join(', ')}`,
      );
    }

    if (role === actor.role && !permissions.includes('roles.manage')) {
      throw new BadRequestException(
        'Removing roles.manage from your own role would lock you out of this screen',
      );
    }

    const wanted = [...new Set(permissions)];

    // Replace rather than diff: the matrix is small, and a delete-then-insert
    // in one transaction leaves no window where a role holds nothing.
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { role } }),
      this.prisma.rolePermission.createMany({
        data: wanted.map((permission) => ({ role, permission })),
        skipDuplicates: true,
      }),
    ]);

    this.permissions.invalidate();

    await this.audit.record(
      actor.id,
      AUDIT_ACTIONS.ROLE_PERMISSIONS_UPDATE,
      null,
      { role, permissions: wanted },
    );

    this.logger.log(
      `setPermissions – role=${role} count=${wanted.length} by=${actor.id}`,
    );
    return { role, permissions: wanted.sort() };
  }

  /** Everything a signed-in staff member needs to render their own nav. */
  async me(profile: Profile) {
    const held = await this.permissions.permissionsFor(profile.role);
    return {
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      role: profile.role,
      avatarUrl: profile.avatarUrl,
      images: profile.images,
      permissions: [...held].sort(),
      allPermissions: ALL_PERMISSIONS,
    };
  }
}
