import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ChatService, CreateConversationDto } from './chat.service';
import type { Profile } from '@prisma/client';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('conversations')
  getConversations(@CurrentUser() user: Profile) {
    return this.chat.getConversations(user.id);
  }

  @Post('conversations')
  getOrCreate(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: Profile,
  ) {
    return this.chat.getOrCreateConversation(user.id, dto.targetId);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Param('id') id: string,
    @Query('cursor') cursor: string | undefined,
    @CurrentUser() user: Profile,
  ) {
    return this.chat.getMessages(id, user.id, cursor);
  }
}
