import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { NotificationsService } from './notifications.service';
import type { Profile } from '@prisma/client';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  getRecent(@CurrentUser() user: Profile) {
    return this.notifications.getRecent(user.id);
  }

  @Post('mark-read')
  markAllRead(@CurrentUser() user: Profile) {
    return this.notifications.markAllRead(user.id);
  }
}
