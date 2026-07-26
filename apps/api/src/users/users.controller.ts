import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService, SearchProfilesDto } from './users.service';
import type { Profile } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('search')
  @UseGuards(OptionalJwtAuthGuard)
  search(@Query() query: SearchProfilesDto, @CurrentUser() user?: Profile) {
    return this.usersService.search(query, user?.id);
  }

  @Get('chat-search')
  @UseGuards(JwtAuthGuard)
  chatSearch(@Query('q') q: string, @CurrentUser() user: Profile) {
    if (!q?.trim()) return [];
    return this.usersService.chatSearch(q.trim(), user.id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() user?: Profile) {
    return this.usersService.findOne(id, user?.id);
  }
}
