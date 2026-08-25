import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Put,
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
import { RolesService } from './roles.service';
import { SetRolePermissionsDto } from './dto/role.dto';

@Controller('admin/roles')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.MODERATOR, Role.ADMIN, Role.SUPER_ADMIN)
@RequirePermissions(PERMISSIONS.ROLES_MANAGE)
export class AdminRolesController {
  constructor(private roles: RolesService) {}

  @Get()
  matrix() {
    return this.roles.matrix();
  }

  @Put(':role/permissions')
  setPermissions(
    @CurrentUser() user: Profile,
    @Param('role', new ParseEnumPipe(Role)) role: Role,
    @Body() dto: SetRolePermissionsDto,
  ) {
    return this.roles.setPermissions(user, role, dto.permissions);
  }
}
