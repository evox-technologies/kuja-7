import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Profile } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { PermissionsGuard } from './permissions.guard';
import { RequirePermissions } from './require-permissions.decorator';
import { PERMISSIONS } from './permissions';
import { StatsService } from './stats.service';

@Controller('admin/stats')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.MODERATOR, Role.ADMIN, Role.SUPER_ADMIN)
export class StatsController {
  constructor(private stats: StatsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.STATISTICS_VIEW)
  overview() {
    return this.stats.overview();
  }

  /**
   * A staff member's own numbers. Deliberately not behind statistics.view — a
   * moderator should always be able to see their own output, which is what
   * their dashboard shows when the platform-wide view is not theirs to see.
   */
  @Get('me')
  mine(@CurrentUser() user: Profile) {
    return this.stats.forModerator(user.id);
  }
}
