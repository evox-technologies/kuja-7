import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Profile } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { PermissionsGuard } from './permissions.guard';
import { RequirePermissions } from './require-permissions.decorator';
import { PERMISSIONS } from './permissions';
import { AdminUsersService } from './admin-users.service';
import { RolesService } from './roles.service';
import {
  AdminCreateUserDto,
  AdminUpdateUserDto,
  ListUsersDto,
  SetActiveDto,
  SetVerificationDto,
} from './dto/admin-user.dto';

/**
 * Member management for the admin portal.
 *
 * Two layers of gate: RolesGuard keeps ordinary members out of every route
 * here, then PermissionsGuard checks the specific grant. The front-end hides
 * what a moderator cannot do, but this is what actually enforces it.
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.MODERATOR, Role.ADMIN, Role.SUPER_ADMIN)
export class AdminController {
  constructor(
    private users: AdminUsersService,
    private roles: RolesService,
  ) {}

  /** The caller's own role and permissions — drives the portal's navigation. */
  @Get('me')
  me(@CurrentUser() user: Profile) {
    return this.roles.me(user);
  }

  @Get('users')
  @RequirePermissions(PERMISSIONS.USERS_VIEW)
  list(@Query() query: ListUsersDto) {
    return this.users.list(query);
  }

  @Get('users/:id')
  @RequirePermissions(PERMISSIONS.USERS_VIEW)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.findOne(id);
  }

  @Post('users')
  @RequirePermissions(PERMISSIONS.USERS_CREATE)
  create(@CurrentUser() user: Profile, @Body() dto: AdminCreateUserDto) {
    return this.users.create(user, dto);
  }

  @Patch('users/:id')
  @RequirePermissions(PERMISSIONS.USERS_EDIT)
  update(
    @CurrentUser() user: Profile,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.users.update(user, id, dto);
  }

  @Patch('users/:id/verification')
  @RequirePermissions(PERMISSIONS.USERS_VERIFY)
  setVerification(
    @CurrentUser() user: Profile,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetVerificationDto,
  ) {
    return this.users.setVerification(user, id, dto);
  }

  @Patch('users/:id/active')
  @RequirePermissions(PERMISSIONS.USERS_EDIT)
  setActive(
    @CurrentUser() user: Profile,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetActiveDto,
  ) {
    return this.users.setActive(user, id, dto.isActive);
  }

  @Delete('users/:id')
  @RequirePermissions(PERMISSIONS.USERS_DELETE)
  remove(@CurrentUser() user: Profile, @Param('id', ParseUUIDPipe) id: string) {
    return this.users.remove(user, id);
  }
}
