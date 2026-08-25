import {
  Body,
  Controller,
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
import { ModeratorsService } from './moderators.service';
import {
  ActivityQueryDto,
  CreateModeratorDto,
  ResetModeratorPasswordDto,
  UpdateModeratorDto,
} from './dto/moderator.dto';

@Controller('admin/moderators')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.MODERATOR, Role.ADMIN, Role.SUPER_ADMIN)
@RequirePermissions(PERMISSIONS.MODERATORS_MANAGE)
export class ModeratorsController {
  constructor(private moderators: ModeratorsService) {}

  @Get()
  list() {
    return this.moderators.list();
  }

  /** Per-day created/edited counts behind the productivity chart. */
  @Get('activity')
  activity(@Query() query: ActivityQueryDto) {
    return this.moderators.activity(query);
  }

  @Post()
  create(@CurrentUser() user: Profile, @Body() dto: CreateModeratorDto) {
    return this.moderators.create(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: Profile,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModeratorDto,
  ) {
    return this.moderators.update(user, id, dto);
  }

  @Post(':id/reset-password')
  resetPassword(
    @CurrentUser() user: Profile,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetModeratorPasswordDto,
  ) {
    return this.moderators.resetPassword(user, id, dto.password);
  }
}
