import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InterestStatus, ContactRequestStatus } from '@prisma/client';

const INTEREST_PROFILE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  location: true,
  city: true,
  country: true,
  ethnicity: true,
  profession: true,
  religion: true,
  height: true,
  kujaNumber: true,
  dateOfBirth: true,
  createdAt: true,
};

@Injectable()
export class MatchesService {
  constructor(private prisma: PrismaService) {}

  async sendInterest(senderId: string, receiverId: string) {
    if (senderId === receiverId)
      throw new BadRequestException('Cannot send interest to yourself');

    // If they already sent a pending interest to us, auto-accept both → mutual
    const theirPending = await this.prisma.interest.findFirst({
      where: { senderId: receiverId, receiverId: senderId, status: InterestStatus.PENDING },
    });

    if (theirPending) {
      const [myInterest] = await Promise.all([
        this.prisma.interest.upsert({
          where: { senderId_receiverId: { senderId, receiverId } },
          create: { senderId, receiverId, status: InterestStatus.ACCEPTED },
          update: { status: InterestStatus.ACCEPTED },
        }),
        this.prisma.interest.update({
          where: { id: theirPending.id },
          data: { status: InterestStatus.ACCEPTED },
        }),
        this.prisma.conversation.upsert({
          where: { participant1Id_participant2Id: { participant1Id: receiverId, participant2Id: senderId } },
          create: { participant1Id: receiverId, participant2Id: senderId },
          update: {},
        }),
      ]);
      return myInterest;
    }

    return this.prisma.interest.upsert({
      where: { senderId_receiverId: { senderId, receiverId } },
      create: { senderId, receiverId },
      update: { status: InterestStatus.PENDING },
    });
  }

  async respondToInterest(interestId: string, userId: string, status: InterestStatus) {
    const interest = await this.prisma.interest.findFirst({
      where: { id: interestId, receiverId: userId },
    });
    if (!interest) throw new NotFoundException('Interest not found');

    const updated = await this.prisma.interest.update({
      where: { id: interestId },
      data: { status },
    });

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
      include: { sender: { select: INTEREST_PROFILE_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSentInterests(userId: string) {
    return this.prisma.interest.findMany({
      where: { senderId: userId },
      include: { receiver: { select: INTEREST_PROFILE_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMutualInterests(userId: string) {
    // Profiles where both parties have accepted each other's interest
    const myAccepted = await this.prisma.interest.findMany({
      where: { senderId: userId, status: InterestStatus.ACCEPTED },
      select: { receiverId: true },
    });

    const mutualPartnerIds = myAccepted.map((i) => i.receiverId);
    if (mutualPartnerIds.length === 0) return [];

    const theyAlsoAccepted = await this.prisma.interest.findMany({
      where: {
        senderId: { in: mutualPartnerIds },
        receiverId: userId,
        status: InterestStatus.ACCEPTED,
      },
      include: { sender: { select: INTEREST_PROFILE_SELECT } },
      orderBy: { updatedAt: 'desc' },
    });

    return theyAlsoAccepted;
  }

  async removeInterest(senderId: string, receiverId: string) {
    const interest = await this.prisma.interest.findFirst({
      where: { senderId, receiverId, status: InterestStatus.PENDING },
    });
    if (!interest) throw new NotFoundException('No pending interest to remove');
    await this.prisma.interest.delete({ where: { id: interest.id } });
    return { removed: true };
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
      include: { target: { select: INTEREST_PROFILE_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async sendContactRequest(requesterId: string, targetId: string) {
    if (requesterId === targetId)
      throw new BadRequestException('Cannot request your own contact');

    // Both must have accepted each other's interest
    const [iSent, theySent] = await Promise.all([
      this.prisma.interest.findFirst({
        where: { senderId: requesterId, receiverId: targetId, status: InterestStatus.ACCEPTED },
      }),
      this.prisma.interest.findFirst({
        where: { senderId: targetId, receiverId: requesterId, status: InterestStatus.ACCEPTED },
      }),
    ]);

    if (!iSent || !theySent)
      throw new ForbiddenException('Contact request requires mutual interest');

    return this.prisma.contactRequest.upsert({
      where: { requesterId_targetId: { requesterId, targetId } },
      create: { requesterId, targetId },
      update: { status: ContactRequestStatus.PENDING },
    });
  }

  async respondContactRequest(
    requesterId: string,
    targetId: string,
    action: 'ACCEPT' | 'DECLINE',
  ) {
    const req = await this.prisma.contactRequest.findUnique({
      where: { requesterId_targetId: { requesterId, targetId } },
    });
    if (!req) throw new NotFoundException('Contact request not found');

    return this.prisma.contactRequest.update({
      where: { requesterId_targetId: { requesterId, targetId } },
      data: {
        status: action === 'ACCEPT' ? ContactRequestStatus.ACCEPTED : ContactRequestStatus.DECLINED,
      },
    });
  }

  async getContactRequestStatus(requesterId: string, targetId: string) {
    const [myRequest, theirRequest] = await Promise.all([
      this.prisma.contactRequest.findUnique({
        where: { requesterId_targetId: { requesterId, targetId } },
        select: { status: true },
      }),
      this.prisma.contactRequest.findUnique({
        where: { requesterId_targetId: { requesterId: targetId, targetId: requesterId } },
        select: { status: true },
      }),
    ]);
    return {
      myContactRequestStatus: myRequest?.status ?? null,
      theirContactRequestStatus: theirRequest?.status ?? null,
    };
  }
}
