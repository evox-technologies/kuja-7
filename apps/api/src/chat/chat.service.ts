import { Injectable, NotFoundException } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class CreateConversationDto {
  @IsUUID()
  targetId!: string;
}

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getConversations(profileId: string) {
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
            avatarUrl: true,
          },
        },
        participant2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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

    return convs.map((conv) => ({
      id: conv.id,
      other:
        conv.participant1Id === profileId
          ? conv.participant2
          : conv.participant1,
      lastMessage: conv.messages[0] ?? null,
      createdAt: conv.createdAt,
    }));
  }

  async getOrCreateConversation(profileId: string, targetId: string) {
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
            avatarUrl: true,
          },
        },
        participant2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (existing) {
      return {
        id: existing.id,
        other:
          existing.participant1Id === profileId
            ? existing.participant2
            : existing.participant1,
      };
    }

    const created = await this.prisma.conversation.create({
      data: { participant1Id: profileId, participant2Id: targetId },
      include: {
        participant1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        participant2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

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
    const conv = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participant1Id: profileId }, { participant2Id: profileId }],
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

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
    return { messages: messages.reverse(), hasMore };
  }
}
