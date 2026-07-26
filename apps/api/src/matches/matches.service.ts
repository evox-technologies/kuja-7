import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InterestStatus, ContactRequestStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

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
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async sendInterest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      this.logger.warn(
        `sendInterest – self-interest attempted: senderId=${senderId}`,
      );
      throw new BadRequestException('Cannot send interest to yourself');
    }

    const sender = await this.prisma.profile.findUnique({
      where: { id: senderId },
      select: { profileCompleted: true },
    });

    if (!sender?.profileCompleted) {
      this.logger.warn(
        `sendInterest – blocked: profile incomplete for senderId=${senderId}`,
      );
      throw new ForbiddenException(
        'Complete your profile before sending interests',
      );
    }

    this.logger.log(
      `sendInterest – senderId=${senderId} → receiverId=${receiverId}`,
    );

    const theirPending = await this.prisma.interest.findFirst({
      where: {
        senderId: receiverId,
        receiverId: senderId,
        status: InterestStatus.PENDING,
      },
    });

    if (theirPending) {
      this.logger.log(
        `sendInterest – mutual detected, auto-accepting both. senderId=${senderId} receiverId=${receiverId}`,
      );

      const [myInterest] = await this.prisma.$transaction([
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
          where: {
            participant1Id_participant2Id: {
              participant1Id: receiverId,
              participant2Id: senderId,
            },
          },
          create: { participant1Id: receiverId, participant2Id: senderId },
          update: {},
        }),
      ]);

      this.logger.log(
        `sendInterest – auto-mutual complete, conversation created: senderId=${senderId} receiverId=${receiverId}`,
      );
      await this.notifications.notifyInterestAccepted(
        receiverId,
        senderId,
        theirPending.id,
      );
      return myInterest;
    }

    const interest = await this.prisma.interest.upsert({
      where: { senderId_receiverId: { senderId, receiverId } },
      create: { senderId, receiverId },
      update: { status: InterestStatus.PENDING },
    });

    this.logger.log(
      `sendInterest – interest upserted as PENDING: id=${interest.id}`,
    );
    await this.notifications.notifyInterestReceived(
      receiverId,
      senderId,
      interest.id,
    );
    return interest;
  }

  async respondToInterest(
    interestId: string,
    userId: string,
    status: InterestStatus,
  ) {
    this.logger.log(
      `respondToInterest – interestId=${interestId} userId=${userId} status=${status}`,
    );

    const interest = await this.prisma.interest.findFirst({
      where: { id: interestId, receiverId: userId },
    });

    if (!interest) {
      this.logger.warn(
        `respondToInterest – interest not found or access denied: interestId=${interestId} userId=${userId}`,
      );
      throw new NotFoundException('Interest not found');
    }

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
      this.logger.log(
        `respondToInterest – accepted, conversation ensured: senderId=${interest.senderId} receiverId=${interest.receiverId}`,
      );
      await this.notifications.notifyInterestAccepted(
        interest.senderId,
        userId,
        interestId,
      );
    } else {
      this.logger.log(`respondToInterest – rejected: interestId=${interestId}`);
    }

    return updated;
  }

  async getReceivedInterests(userId: string) {
    this.logger.log(`getReceivedInterests – userId=${userId}`);

    const interests = await this.prisma.interest.findMany({
      where: { receiverId: userId, status: InterestStatus.PENDING },
      include: { sender: { select: INTEREST_PROFILE_SELECT } },
      orderBy: { createdAt: 'desc' },
    });

    this.logger.log(
      `getReceivedInterests – returned ${interests.length} pending interest(s) for userId=${userId}`,
    );
    return interests;
  }

  async getSentInterests(userId: string) {
    this.logger.log(`getSentInterests – userId=${userId}`);

    const interests = await this.prisma.interest.findMany({
      where: { senderId: userId },
      include: { receiver: { select: INTEREST_PROFILE_SELECT } },
      orderBy: { createdAt: 'desc' },
    });

    this.logger.log(
      `getSentInterests – returned ${interests.length} interest(s) for userId=${userId}`,
    );
    return interests;
  }

  async getMutualInterests(userId: string) {
    this.logger.log(`getMutualInterests – userId=${userId}`);

    const myAccepted = await this.prisma.interest.findMany({
      where: { senderId: userId, status: InterestStatus.ACCEPTED },
      select: { receiverId: true },
    });

    const mutualPartnerIds = myAccepted.map((i) => i.receiverId);
    if (mutualPartnerIds.length === 0) {
      this.logger.log(
        `getMutualInterests – no mutual partners for userId=${userId}`,
      );
      return [];
    }

    const theyAlsoAccepted = await this.prisma.interest.findMany({
      where: {
        senderId: { in: mutualPartnerIds },
        receiverId: userId,
        status: InterestStatus.ACCEPTED,
      },
      include: { sender: { select: INTEREST_PROFILE_SELECT } },
      orderBy: { updatedAt: 'desc' },
    });

    this.logger.log(
      `getMutualInterests – returned ${theyAlsoAccepted.length} mutual match(es) for userId=${userId}`,
    );
    return theyAlsoAccepted;
  }

  async removeInterest(senderId: string, receiverId: string) {
    this.logger.log(
      `removeInterest – senderId=${senderId} receiverId=${receiverId}`,
    );

    const interest = await this.prisma.interest.findFirst({
      where: { senderId, receiverId, status: InterestStatus.PENDING },
    });

    if (!interest) {
      this.logger.warn(
        `removeInterest – no pending interest found: senderId=${senderId} receiverId=${receiverId}`,
      );
      throw new NotFoundException('No pending interest to remove');
    }

    await this.prisma.interest.delete({ where: { id: interest.id } });
    this.logger.log(`removeInterest – interest deleted: id=${interest.id}`);
    return { removed: true };
  }

  async toggleShortlist(userId: string, targetId: string) {
    this.logger.log(`toggleShortlist – userId=${userId} targetId=${targetId}`);

    const existing = await this.prisma.shortlist.findUnique({
      where: { userId_targetId: { userId, targetId } },
    });

    if (existing) {
      await this.prisma.shortlist.delete({
        where: { userId_targetId: { userId, targetId } },
      });
      this.logger.log(
        `toggleShortlist – removed from shortlist: userId=${userId} targetId=${targetId}`,
      );
      return { shortlisted: false };
    }

    await this.prisma.shortlist.create({ data: { userId, targetId } });
    this.logger.log(
      `toggleShortlist – added to shortlist: userId=${userId} targetId=${targetId}`,
    );
    return { shortlisted: true };
  }

  async getShortlist(userId: string) {
    this.logger.log(`getShortlist – userId=${userId}`);

    const list = await this.prisma.shortlist.findMany({
      where: { userId },
      include: { target: { select: INTEREST_PROFILE_SELECT } },
      orderBy: { createdAt: 'desc' },
    });

    this.logger.log(
      `getShortlist – returned ${list.length} shortlisted profile(s) for userId=${userId}`,
    );
    return list;
  }

  async sendContactRequest(requesterId: string, targetId: string) {
    if (requesterId === targetId) {
      this.logger.warn(
        `sendContactRequest – self-request attempted: requesterId=${requesterId}`,
      );
      throw new BadRequestException('Cannot request your own contact');
    }

    this.logger.log(
      `sendContactRequest – requesterId=${requesterId} targetId=${targetId}`,
    );

    const [iSent, theySent] = await Promise.all([
      this.prisma.interest.findFirst({
        where: {
          senderId: requesterId,
          receiverId: targetId,
          status: InterestStatus.ACCEPTED,
        },
      }),
      this.prisma.interest.findFirst({
        where: {
          senderId: targetId,
          receiverId: requesterId,
          status: InterestStatus.ACCEPTED,
        },
      }),
    ]);

    if (!iSent || !theySent) {
      this.logger.warn(
        `sendContactRequest – mutual interest required but not met: requesterId=${requesterId} targetId=${targetId}`,
      );
      throw new ForbiddenException('Contact request requires mutual interest');
    }

    const req = await this.prisma.contactRequest.upsert({
      where: { requesterId_targetId: { requesterId, targetId } },
      create: { requesterId, targetId },
      update: { status: ContactRequestStatus.PENDING },
    });

    this.logger.log(
      `sendContactRequest – contact request upserted: id=${req.id}`,
    );
    return req;
  }

  async respondContactRequest(
    requesterId: string,
    targetId: string,
    action: 'ACCEPT' | 'DECLINE',
  ) {
    this.logger.log(
      `respondContactRequest – requesterId=${requesterId} targetId=${targetId} action=${action}`,
    );

    const req = await this.prisma.contactRequest.findUnique({
      where: { requesterId_targetId: { requesterId, targetId } },
    });

    if (!req) {
      this.logger.warn(
        `respondContactRequest – contact request not found: requesterId=${requesterId} targetId=${targetId}`,
      );
      throw new NotFoundException('Contact request not found');
    }

    if (req.status !== ContactRequestStatus.PENDING) {
      this.logger.warn(
        `respondContactRequest – already resolved (${req.status}): requesterId=${requesterId} targetId=${targetId}`,
      );
      throw new BadRequestException(
        `Contact request is already ${req.status.toLowerCase()}`,
      );
    }

    const updated = await this.prisma.contactRequest.update({
      where: { requesterId_targetId: { requesterId, targetId } },
      data: {
        status:
          action === 'ACCEPT'
            ? ContactRequestStatus.ACCEPTED
            : ContactRequestStatus.DECLINED,
      },
    });

    this.logger.log(
      `respondContactRequest – updated to ${updated.status}: requesterId=${requesterId} targetId=${targetId}`,
    );
    return updated;
  }

  async getContactRequestStatus(requesterId: string, targetId: string) {
    this.logger.log(
      `getContactRequestStatus – requesterId=${requesterId} targetId=${targetId}`,
    );

    const [myRequest, theirRequest] = await Promise.all([
      this.prisma.contactRequest.findUnique({
        where: { requesterId_targetId: { requesterId, targetId } },
        select: { status: true },
      }),
      this.prisma.contactRequest.findUnique({
        where: {
          requesterId_targetId: {
            requesterId: targetId,
            targetId: requesterId,
          },
        },
        select: { status: true },
      }),
    ]);

    return {
      myContactRequestStatus: myRequest?.status ?? null,
      theirContactRequestStatus: theirRequest?.status ?? null,
    };
  }
}
