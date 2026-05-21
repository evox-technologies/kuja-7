import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MODERATOR)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  stats() {
    return this.adminService.stats();
  }

  @Get('users')
  listUsers(@Query('page') page = 1) {
    return this.adminService.listUsers(+page);
  }

  @Patch('users/:id/verify')
  @Roles(Role.ADMIN, Role.MODERATOR)
  verify(@Param('id') id: string) {
    return this.adminService.verifyProfile(id);
  }

  @Patch('users/:id/deactivate')
  @Roles(Role.ADMIN)
  deactivate(@Param('id') id: string) {
    return this.adminService.deactivateProfile(id);
  }
}
