import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PERMISSIONS_KEY } from './require-permissions.decorator';
import { Permission } from './permissions';
import { PermissionsService } from './permissions.service';

/**
 * Must run after JwtAuthGuard — it reads the Profile that guard attaches.
 *
 * Unlike RolesGuard this throws with a message rather than returning false, so
 * a moderator hitting an admin-only route learns which permission they lack
 * instead of getting a bare 403.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private reflector: Reflector,
    private permissions: PermissionsService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    if (!required?.length) return true;

    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Not signed in');

    const held = await this.permissions.permissionsFor(user.role);
    const missing = required.filter((p) => !held.has(p));

    if (missing.length) {
      this.logger.warn(
        `denied – profileId=${user.id} role=${user.role} missing=${missing.join(',')}`,
      );
      throw new ForbiddenException(`Missing permission: ${missing.join(', ')}`);
    }

    return true;
  }
}
