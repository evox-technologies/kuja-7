import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';
import { ModeratorsController } from './moderators.controller';
import { AdminRolesController } from './roles.controller';
import { StatsController } from './stats.controller';
import { AdminUsersService } from './admin-users.service';
import { ModeratorsService } from './moderators.service';
import { RolesService } from './roles.service';
import { StatsService } from './stats.service';
import { AuditService } from './audit.service';
import { PermissionsService } from './permissions.service';
import { PermissionsGuard } from './permissions.guard';
import { SupabaseAdminService } from './supabase-admin.service';

@Module({
  imports: [AuthModule],
  controllers: [
    AdminController,
    ModeratorsController,
    AdminRolesController,
    StatsController,
  ],
  providers: [
    AdminUsersService,
    ModeratorsService,
    RolesService,
    StatsService,
    AuditService,
    PermissionsService,
    PermissionsGuard,
    SupabaseAdminService,
  ],
  // MatchesModule reads isDummy directly off the Profile, so nothing else here
  // needs exporting yet.
  exports: [PermissionsService],
})
export class AdminModule {}
