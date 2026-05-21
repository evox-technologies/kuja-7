import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { WsJwtGuard } from './ws-jwt.guard';
import { SupabaseJwtService } from '../auth/supabase-jwt.service';
import { AuthenticatedSocket } from './chat.types';
import { IsString, IsUUID, MaxLength } from 'class-validator';

class SendMessageDto {
  @IsUUID()
  conversationId!: string;

  @IsString()
  @MaxLength(2000)
  content!: string;
}

// CORS origin must be read from process.env here — decorators are evaluated at
// class-definition time, before the NestJS DI container is available.
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: SupabaseJwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth as Record<string, string> | undefined)?.token ??
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) throw new WsException('Missing token');

      const payload = await this.jwtService.verifyToken(token);
      const profile = await this.prisma.profile.findUnique({
        where: { supabaseId: payload.sub },
      });

      if (!profile || !profile.isActive) throw new WsException('Unauthorized');

      (client as AuthenticatedSocket).profile = profile;

      const conversations = await this.prisma.conversation.findMany({
        where: {
          OR: [{ participant1Id: profile.id }, { participant2Id: profile.id }],
        },
        select: { id: true },
      });

      for (const { id } of conversations) {
        await client.join(id);
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    delete (client as unknown as Partial<AuthenticatedSocket>).profile;
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const { profile } = client as AuthenticatedSocket;
    const conv = await this.prisma.conversation.findFirst({
      where: {
        id: data.conversationId,
        OR: [{ participant1Id: profile.id }, { participant2Id: profile.id }],
      },
    });
    if (!conv) throw new WsException('Not authorized');
    await client.join(data.conversationId);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const { profile: sender } = client as AuthenticatedSocket;

    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: dto.conversationId,
        OR: [{ participant1Id: sender.id }, { participant2Id: sender.id }],
      },
    });

    if (!conversation) throw new WsException('Conversation not found');

    const message = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        senderId: sender.id,
        content: dto.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: { lastMessageAt: message.createdAt },
    });

    this.server.to(dto.conversationId).emit('new_message', message);
    return message;
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const { profile: reader } = client as AuthenticatedSocket;

    await this.prisma.message.updateMany({
      where: {
        conversationId: data.conversationId,
        senderId: { not: reader.id },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    this.server.to(data.conversationId).emit('messages_read', {
      conversationId: data.conversationId,
      readBy: reader.id,
    });
  }
}
