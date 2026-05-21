import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InterestStatus } from '@prisma/client';

@Injectable()
export class MatchesService {
  constructor(private prisma: PrismaService) {}

  async sendInterest(senderId: string, receiverId: string) {
    if (senderId === receiverId)
      throw new BadRequestException('Cannot send interest to yourself');

    return this.prisma.interest.upsert({
      where: { senderId_receiverId: { senderId, receiverId } },
      create: { senderId, receiverId },
      update: { status: InterestStatus.PENDING },
    });
  }

  async respondToInterest(
    interestId: string,
    userId: string,
    status: InterestStatus,
  ) {
    const interest = await this.prisma.interest.findFirst({
      where: { id: interestId, receiverId: userId },
    });
    if (!interest) throw new NotFoundException('Interest not found');

    const updated = await this.prisma.interest.update({
      where: { id: interestId },
      data: { status },
    });

    // Create conversation when interest is accepted
    if (status === InterestStatus.ACCEPTED) {
      await this.prisma.conversation.upsert({
        where: {
          participant1Id_participant2Id: {
            participant1Id: interest.senderId,
            participant2Id: interest.receiverId,
          },
        },
        create: {
          participant1Id: interest.senderId,
          participant2Id: interest.receiverId,
        },
        update: {},
      });
    }

    return updated;
  }

  async getReceivedInterests(userId: string) {
    return this.prisma.interest.findMany({
      where: { receiverId: userId, status: InterestStatus.PENDING },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleShortlist(userId: string, targetId: string) {
    const existing = await this.prisma.shortlist.findUnique({
      where: { userId_targetId: { userId, targetId } },
    });

    if (existing) {
      await this.prisma.shortlist.delete({
        where: { userId_targetId: { userId, targetId } },
      });
      return { shortlisted: false };
    }

    await this.prisma.shortlist.create({ data: { userId, targetId } });
    return { shortlisted: true };
  }

  async getShortlist(userId: string) {
    return this.prisma.shortlist.findMany({
      where: { userId },
      include: {
        target: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
