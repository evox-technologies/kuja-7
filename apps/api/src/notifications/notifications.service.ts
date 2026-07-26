import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';

const ACTOR_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  gender: true,
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async getRecent(userId: string, take = 20) {
    this.logger.log(`getRecent – userId=${userId}`);

    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { recipientId: userId },
        orderBy: { createdAt: 'desc' },
        take,
        include: { actor: { select: ACTOR_SELECT } },
      }),
      this.prisma.notification.count({
        where: { recipientId: userId, read: false },
      }),
    ]);

    return { items, unreadCount };
  }

  async markAllRead(userId: string) {
    this.logger.log(`markAllRead – userId=${userId}`);

    const result = await this.prisma.notification.updateMany({
      where: { recipientId: userId, read: false },
      data: { read: true },
    });

    this.logger.log(
      `markAllRead – marked ${result.count} as read for userId=${userId}`,
    );
    return { success: true };
  }

  async notifyInterestReceived(
    receiverId: string,
    senderId: string,
    interestId: string,
  ) {
    const notification = await this.create({
      recipientId: receiverId,
      actorId: senderId,
      type: NotificationType.INTEREST_RECEIVED,
      interestId,
    });
    this.emit(receiverId, notification);
    return notification;
  }

  async notifyInterestAccepted(
    originalSenderId: string,
    accepterId: string,
    interestId: string,
  ) {
    const notification = await this.create({
      recipientId: originalSenderId,
      actorId: accepterId,
      type: NotificationType.INTEREST_ACCEPTED,
      interestId,
    });
    this.emit(originalSenderId, notification);
    return notification;
  }

  private async create(data: {
    recipientId: string;
    actorId: string;
    type: NotificationType;
    interestId?: string;
  }) {
    this.logger.log(
      `create – type=${data.type} recipientId=${data.recipientId} actorId=${data.actorId}`,
    );
    return this.prisma.notification.create({
      data,
      include: { actor: { select: ACTOR_SELECT } },
    });
  }

  private emit(recipientId: string, notification: unknown) {
    this.chatGateway.server
      .to(`user:${recipientId}`)
      .emit('notification', notification);
  }
}
