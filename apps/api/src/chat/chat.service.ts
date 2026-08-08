import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class CreateConversationDto {
  @IsUUID()
  targetId!: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getConversations(profileId: string) {
    this.logger.log(`getConversations – fetching for profileId=${profileId}`);

    const convs = await this.prisma.conversation.findMany({
      where: {
        OR: [{ participant1Id: profileId }, { participant2Id: profileId }],
      },
      include: {
        participant1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            avatarUrl: true,
          },
        },
        participant2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            avatarUrl: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, content: true, createdAt: true, senderId: true },
        },
      },
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
    });

    this.logger.log(
      `getConversations – returned ${convs.length} conversation(s) for profileId=${profileId}`,
    );

    const unreadByConversation = await this.prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: { in: convs.map((c) => c.id) },
        senderId: { not: profileId },
        readAt: null,
      },
      _count: { _all: true },
    });
    const unreadMap = new Map(
      unreadByConversation.map((u) => [u.conversationId, u._count._all]),
    );

    return convs.map((conv) => ({
      id: conv.id,
      other:
        conv.participant1Id === profileId
          ? conv.participant2
          : conv.participant1,
      lastMessage: conv.messages[0] ?? null,
      createdAt: conv.createdAt,
      unreadCount: unreadMap.get(conv.id) ?? 0,
    }));
  }

  async getUnreadCount(profileId: string) {
    this.logger.log(`getUnreadCount – profileId=${profileId}`);

    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ participant1Id: profileId }, { participant2Id: profileId }],
      },
      select: { id: true },
    });

    if (conversations.length === 0) return { count: 0 };

    const count = await this.prisma.message.count({
      where: {
        conversationId: { in: conversations.map((c) => c.id) },
        senderId: { not: profileId },
        readAt: null,
      },
    });

    return { count };
  }

  async getOrCreateConversation(profileId: string, targetId: string) {
    this.logger.log(
      `getOrCreateConversation – profileId=${profileId} targetId=${targetId}`,
    );

    const existing = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1Id: profileId, participant2Id: targetId },
          { participant1Id: targetId, participant2Id: profileId },
        ],
      },
      include: {
        participant1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            avatarUrl: true,
          },
        },
        participant2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (existing) {
      this.logger.log(
        `getOrCreateConversation – existing conversation found: id=${existing.id}`,
      );
      return {
        id: existing.id,
        other:
          existing.participant1Id === profileId
            ? existing.participant2
            : existing.participant1,
      };
    }

    // Sorted so the ordered @@unique([participant1Id, participant2Id]) enforces
    // one conversation per pair instead of one per ordering.
    const [participant1Id, participant2Id] = [profileId, targetId].sort();

    const created = await this.prisma.conversation.create({
      data: { participant1Id, participant2Id },
      include: {
        participant1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            avatarUrl: true,
          },
        },
        participant2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            avatarUrl: true,
          },
        },
      },
    });

    this.logger.log(
      `getOrCreateConversation – new conversation created: id=${created.id}`,
    );

    return {
      id: created.id,
      other:
        created.participant1Id === profileId
          ? created.participant2
          : created.participant1,
    };
  }

  async getMessages(
    conversationId: string,
    profileId: string,
    cursor?: string,
  ) {
    this.logger.log(
      `getMessages – conversationId=${conversationId} profileId=${profileId} cursor=${cursor ?? 'none'}`,
    );

    const conv = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participant1Id: profileId }, { participant2Id: profileId }],
      },
    });

    if (!conv) {
      this.logger.warn(
        `getMessages – conversation not found or access denied: conversationId=${conversationId} profileId=${profileId}`,
      );
      throw new NotFoundException('Conversation not found');
    }

    const take = 50;
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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

    const hasMore = messages.length > take;
    if (hasMore) messages.pop();

    this.logger.log(
      `getMessages – returned ${messages.length} message(s) for conversationId=${conversationId} hasMore=${hasMore}`,
    );

    return { messages: messages.reverse(), hasMore };
  }
}
