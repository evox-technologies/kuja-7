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
import { UseGuards, UseFilters, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { WsJwtGuard } from './ws-jwt.guard';
import { WsExceptionFilter } from '../common/filters/ws-exception.filter';
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

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
@UseFilters(WsExceptionFilter)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: SupabaseJwtService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`handleConnection – client=${client.id}`);

    try {
      const token =
        (client.handshake.auth as Record<string, string> | undefined)?.token ??
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(
          `handleConnection – missing token, disconnecting client=${client.id}`,
        );
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyToken(token);
      const profile = await this.prisma.profile.findUnique({
        where: { supabaseId: payload.sub },
      });

      if (!profile || !profile.isActive) {
        this.logger.warn(
          `handleConnection – profile not found or inactive for sub=${payload.sub}, disconnecting client=${client.id}`,
        );
        client.disconnect();
        return;
      }

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

      await client.join(`user:${profile.id}`);

      this.logger.log(
        `handleConnection – authenticated profileId=${profile.id}, joined ${conversations.length} room(s)`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `handleConnection – unexpected error for client=${client.id}: ${message}`,
        err instanceof Error ? err.stack : undefined,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const profileId =
      (client as unknown as Partial<AuthenticatedSocket>).profile?.id ??
      'unauthenticated';
    this.logger.log(
      `handleDisconnect – client=${client.id} profileId=${profileId}`,
    );
    delete (client as unknown as Partial<AuthenticatedSocket>).profile;
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const { profile } = client as AuthenticatedSocket;
    this.logger.log(
      `join_conversation – profileId=${profile.id} conversationId=${data.conversationId}`,
    );

    const conv = await this.prisma.conversation.findFirst({
      where: {
        id: data.conversationId,
        OR: [{ participant1Id: profile.id }, { participant2Id: profile.id }],
      },
    });

    if (!conv) {
      this.logger.warn(
        `join_conversation – access denied: profileId=${profile.id} conversationId=${data.conversationId}`,
      );
      throw new WsException('Not authorized');
    }

    await client.join(data.conversationId);
    this.logger.log(
      `join_conversation – joined room: profileId=${profile.id} conversationId=${data.conversationId}`,
    );
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const { profile: sender } = client as AuthenticatedSocket;
    this.logger.log(
      `send_message – senderId=${sender.id} conversationId=${dto.conversationId}`,
    );

    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: dto.conversationId,
        OR: [{ participant1Id: sender.id }, { participant2Id: sender.id }],
      },
    });

    if (!conversation) {
      this.logger.warn(
        `send_message – conversation not found or access denied: senderId=${sender.id} conversationId=${dto.conversationId}`,
      );
      throw new WsException('Conversation not found');
    }

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

    this.logger.log(
      `send_message – message created: id=${message.id} conversationId=${dto.conversationId}`,
    );

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
    this.logger.log(
      `mark_read – readerId=${reader.id} conversationId=${data.conversationId}`,
    );

    // Verify the reader belongs to this conversation before marking
    const conv = await this.prisma.conversation.findFirst({
      where: {
        id: data.conversationId,
        OR: [{ participant1Id: reader.id }, { participant2Id: reader.id }],
      },
    });

    if (!conv) {
      this.logger.warn(
        `mark_read – access denied: readerId=${reader.id} conversationId=${data.conversationId}`,
      );
      throw new WsException('Not authorized');
    }

    const result = await this.prisma.message.updateMany({
      where: {
        conversationId: data.conversationId,
        senderId: { not: reader.id },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    this.logger.log(
      `mark_read – marked ${result.count} message(s) as read: readerId=${reader.id} conversationId=${data.conversationId}`,
    );

    this.server.to(data.conversationId).emit('messages_read', {
      conversationId: data.conversationId,
      readBy: reader.id,
    });
  }
}
