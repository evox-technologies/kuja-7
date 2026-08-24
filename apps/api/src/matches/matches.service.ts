import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InterestStatus, ContactRequestStatus, Prisma } from '@prisma/client';
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

  /**
   * Returns the pair's conversation, creating it only if neither ordering
   * exists. The @@unique on Conversation covers the *ordered* pair, so an
   * upsert keyed on (a, b) silently creates a second row when (b, a) is
   * already there — which is what the chat module writes when a user opens a
   * chat first. New rows are stored with the ids sorted so the constraint can
   * actually enforce one conversation per pair.
   */
  private async ensureConversation(userA: string, userB: string) {
    const pairFilter = {
      OR: [
        { participant1Id: userA, participant2Id: userB },
        { participant1Id: userB, participant2Id: userA },
      ],
    };

    const existing = await this.prisma.conversation.findFirst({
      where: pairFilter,
    });
    if (existing) return existing;

    const [participant1Id, participant2Id] = [userA, userB].sort();

    try {
      return await this.prisma.conversation.create({
        data: { participant1Id, participant2Id },
      });
    } catch (error) {
      // Concurrent accept/open-chat raced us to it.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return this.prisma.conversation.findFirst({ where: pairFilter });
      }
      throw error;
    }
  }

  /**
   * Matches a member with a sample profile on the spot.
   *
   * Mirrors the auto-mutual branch below: both directions are ACCEPTED, the
   * conversation is opened, and the member is notified as though the profile
   * had accepted them. The reciprocal row matters — `isMutual` is read from
   * whichever side is accepted, and the interests screens list rows, so without
   * it the match would be invisible from the sample profile's side.
   */
  private async autoReciprocateInterest(senderId: string, receiverId: string) {
    this.logger.log(
      `sendInterest – receiver is a sample profile, auto-matching: senderId=${senderId} receiverId=${receiverId}`,
    );

    const [myInterest, theirInterest] = await this.prisma.$transaction([
      this.prisma.interest.upsert({
        where: { senderId_receiverId: { senderId, receiverId } },
        create: { senderId, receiverId, status: InterestStatus.ACCEPTED },
        update: { status: InterestStatus.ACCEPTED },
      }),
      this.prisma.interest.upsert({
        where: {
          senderId_receiverId: { senderId: receiverId, receiverId: senderId },
        },
        create: {
          senderId: receiverId,
          receiverId: senderId,
          status: InterestStatus.ACCEPTED,
        },
        update: { status: InterestStatus.ACCEPTED },
      }),
    ]);

    await this.ensureConversation(receiverId, senderId);

    await this.notifications.notifyInterestAccepted(
      senderId,
      receiverId,
      theirInterest.id,
    );

    this.logger.log(
      `sendInterest – sample profile auto-match complete: senderId=${senderId} receiverId=${receiverId}`,
    );
    return myInterest;
  }

  /**
   * Approves a contact request against a sample profile immediately.
   *
   * Both rows are written on purpose. Contact details are a two-way exchange —
   * users.service.ts only reveals them when the requester's row *and* the
   * incoming row are both ACCEPTED — so approving one side alone would leave
   * the member looking at a blank phone number with no way to explain it.
   */
  private async autoApproveContactRequest(
    requesterId: string,
    targetId: string,
  ) {
    this.logger.log(
      `sendContactRequest – target is a sample profile, auto-approving: requesterId=${requesterId} targetId=${targetId}`,
    );

    const [req] = await this.prisma.$transaction([
      this.prisma.contactRequest.upsert({
        where: { requesterId_targetId: { requesterId, targetId } },
        create: {
          requesterId,
          targetId,
          status: ContactRequestStatus.ACCEPTED,
        },
        update: { status: ContactRequestStatus.ACCEPTED },
      }),
      this.prisma.contactRequest.upsert({
        where: {
          requesterId_targetId: {
            requesterId: targetId,
            targetId: requesterId,
          },
        },
        create: {
          requesterId: targetId,
          targetId: requesterId,
          status: ContactRequestStatus.ACCEPTED,
        },
        update: { status: ContactRequestStatus.ACCEPTED },
      }),
    ]);

    return req;
  }

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

    // Re-sending to someone already matched must not reset the interest to
    // PENDING: that would tear down the existing match for both users.
    const mine = await this.prisma.interest.findUnique({
      where: { senderId_receiverId: { senderId, receiverId } },
    });

    const receiver = await this.prisma.profile.findUnique({
      where: { id: receiverId },
      select: { isDummy: true },
    });

    if (!receiver) {
      this.logger.warn(
        `sendInterest – receiver not found: receiverId=${receiverId}`,
      );
      throw new NotFoundException('Profile not found');
    }

    // Sample profiles have nobody behind them to press accept, so they answer
    // for themselves: the interest comes straight back and the pair matches.
    if (receiver.isDummy && mine?.status !== InterestStatus.ACCEPTED) {
      return this.autoReciprocateInterest(senderId, receiverId);
    }

    if (mine?.status === InterestStatus.ACCEPTED) {
      this.logger.log(
        `sendInterest – already accepted, no-op: senderId=${senderId} receiverId=${receiverId}`,
      );
      return mine;
    }

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
      ]);

      await this.ensureConversation(receiverId, senderId);

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

    if (
      status !== InterestStatus.ACCEPTED &&
      status !== InterestStatus.REJECTED
    ) {
      this.logger.warn(
        `respondToInterest – invalid target status ${status}: interestId=${interestId}`,
      );
      throw new BadRequestException(
        'An interest can only be accepted or rejected',
      );
    }

    const interest = await this.prisma.interest.findFirst({
      where: { id: interestId, receiverId: userId },
    });

    if (!interest) {
      this.logger.warn(
        `respondToInterest – interest not found or access denied: interestId=${interestId} userId=${userId}`,
      );
      throw new NotFoundException('Interest not found');
    }

    // Without this an accepted interest could be flipped to rejected (or the
    // reverse) later, re-firing notifications and silently breaking a match.
    if (interest.status !== InterestStatus.PENDING) {
      this.logger.warn(
        `respondToInterest – already ${interest.status}: interestId=${interestId}`,
      );
      throw new BadRequestException(
        `This interest was already ${interest.status.toLowerCase()}`,
      );
    }

    const updated = await this.prisma.interest.update({
      where: { id: interestId },
      data: { status },
    });

    if (status === InterestStatus.ACCEPTED) {
      await this.ensureConversation(interest.senderId, interest.receiverId);
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

  /**
   * A single ACCEPTED interest is the match — the receiver accepting *is* the
   * mutual event, and the auto-match branch in sendInterest treats crossing
   * interests the same way. Requiring an ACCEPTED row in both directions meant
   * the accept button never produced a match, since nothing writes the
   * reciprocal row.
   */
  async getMutualInterests(userId: string) {
    this.logger.log(`getMutualInterests – userId=${userId}`);

    const accepted = await this.prisma.interest.findMany({
      where: {
        status: InterestStatus.ACCEPTED,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: { select: INTEREST_PROFILE_SELECT },
        receiver: { select: INTEREST_PROFILE_SELECT },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Crossing interests leave two ACCEPTED rows for one pair; show the
    // partner once, keyed off the most recently updated row.
    const seen = new Set<string>();
    const mutual = accepted
      .map((interest) => ({
        id: interest.id,
        status: interest.status,
        createdAt: interest.createdAt,
        updatedAt: interest.updatedAt,
        profile:
          interest.senderId === userId ? interest.receiver : interest.sender,
      }))
      .filter((entry) => {
        if (seen.has(entry.profile.id)) return false;
        seen.add(entry.profile.id);
        return true;
      });

    this.logger.log(
      `getMutualInterests – returned ${mutual.length} mutual match(es) for userId=${userId}`,
    );
    return mutual;
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

    const accepted = await this.prisma.interest.findFirst({
      where: {
        status: InterestStatus.ACCEPTED,
        OR: [
          { senderId: requesterId, receiverId: targetId },
          { senderId: targetId, receiverId: requesterId },
        ],
      },
    });

    if (!accepted) {
      this.logger.warn(
        `sendContactRequest – mutual interest required but not met: requesterId=${requesterId} targetId=${targetId}`,
      );
      throw new ForbiddenException('Contact request requires mutual interest');
    }

    const target = await this.prisma.profile.findUnique({
      where: { id: targetId },
      select: { isDummy: true },
    });

    if (target?.isDummy) {
      return this.autoApproveContactRequest(requesterId, targetId);
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
