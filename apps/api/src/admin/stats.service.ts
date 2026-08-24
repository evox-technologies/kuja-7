import { Injectable, Logger } from '@nestjs/common';
import {
  Gender,
  InterestStatus,
  Prisma,
  VerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Trailing window for the registrations chart and "new in period" counts. */
const WINDOW_DAYS = 30;

const AGE_BUCKETS = [
  { label: '18–24', min: 18, max: 24 },
  { label: '25–29', min: 25, max: 29 },
  { label: '30–34', min: 30, max: 34 },
  { label: '35–39', min: 35, max: 39 },
  { label: '40–49', min: 40, max: 49 },
  { label: '50+', min: 50, max: 200 },
];

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Everything the dashboard renders in one call. The requirements list a few
   * metrics this platform has no data for — reported users, blocked users, paid
   * users and revenue — and those are omitted rather than reported as zero,
   * which would read as "nobody has paid" instead of "billing does not exist".
   */
  async overview() {
    const since = daysAgo(WINDOW_DAYS);

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      verified,
      pendingVerification,
      underReview,
      rejected,
      dummyProfiles,
      completedProfiles,
      newInPeriod,
      male,
      female,
      interestsSent,
      interestsAccepted,
      conversations,
      messagesInPeriod,
      registrations,
      ageDistribution,
      topLocations,
    ] = await Promise.all([
      this.prisma.profile.count(),
      this.prisma.profile.count({ where: { isActive: true } }),
      this.prisma.profile.count({ where: { isActive: false } }),
      this.prisma.profile.count({
        where: { verificationStatus: VerificationStatus.VERIFIED },
      }),
      this.prisma.profile.count({
        where: { verificationStatus: VerificationStatus.PENDING },
      }),
      this.prisma.profile.count({
        where: { verificationStatus: VerificationStatus.UNDER_REVIEW },
      }),
      this.prisma.profile.count({
        where: { verificationStatus: VerificationStatus.REJECTED },
      }),
      this.prisma.profile.count({ where: { isDummy: true } }),
      this.prisma.profile.count({ where: { profileCompleted: true } }),
      this.prisma.profile.count({ where: { createdAt: { gte: since } } }),
      this.prisma.profile.count({ where: { gender: Gender.MALE } }),
      this.prisma.profile.count({ where: { gender: Gender.FEMALE } }),
      this.prisma.interest.count(),
      this.prisma.interest.count({
        where: { status: InterestStatus.ACCEPTED },
      }),
      this.prisma.conversation.count(),
      this.prisma.message.count({ where: { createdAt: { gte: since } } }),
      this.registrationsByDay(since),
      this.ageDistribution(),
      this.topLocations(),
    ]);

    // An accepted interest is one row, but a match is one *pair* — the accept
    // path writes both directions, so counting rows would double every match.
    const matches = Math.floor(interestsAccepted / 2);

    this.logger.log(`overview – ${totalUsers} profile(s)`);

    return {
      windowDays: WINDOW_DAYS,
      totals: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        verified,
        unverified: totalUsers - verified,
        pendingVerification,
        underReview,
        rejected,
        dummyProfiles,
        newInPeriod,
        profileCompletionRate:
          totalUsers === 0
            ? 0
            : Math.round((completedProfiles / totalUsers) * 100),
      },
      gender: [
        { label: 'Female', value: female },
        { label: 'Male', value: male },
      ],
      ageDistribution,
      topLocations,
      engagement: {
        interestsSent,
        interestsAccepted,
        matches,
        conversations,
        messagesInPeriod,
      },
      // Registrations → Interests → Matches → Conversations, per the spec.
      funnel: [
        { label: 'Registrations', value: totalUsers },
        { label: 'Interests', value: interestsSent },
        { label: 'Matches', value: matches },
        { label: 'Conversations', value: conversations },
      ],
      registrations,
    };
  }

  /** A moderator's own output, shown when they lack statistics.view. */
  async forModerator(profileId: string) {
    const since = daysAgo(WINDOW_DAYS);
    const [created, createdInPeriod, edited, pendingVerification] =
      await Promise.all([
        this.prisma.profile.count({ where: { createdById: profileId } }),
        this.prisma.profile.count({
          where: { createdById: profileId, createdAt: { gte: since } },
        }),
        this.prisma.adminAuditLog.count({
          where: { actorId: profileId, action: 'user.update' },
        }),
        this.prisma.profile.count({
          where: {
            verificationStatus: {
              in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW],
            },
          },
        }),
      ]);

    return {
      windowDays: WINDOW_DAYS,
      profilesCreated: created,
      profilesCreatedInPeriod: createdInPeriod,
      profilesEdited: edited,
      pendingVerification,
    };
  }

  private async registrationsByDay(since: Date) {
    const rows = await this.prisma.$queryRaw<{ day: Date; count: bigint }[]>(
      Prisma.sql`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS count
        FROM "profiles"
        WHERE "createdAt" >= ${since}
        GROUP BY 1
        ORDER BY 1 ASC
      `,
    );

    const byDay = new Map(
      rows.map((r) => [r.day.toISOString().slice(0, 10), Number(r.count)]),
    );

    // Fill the gaps so the line has no holes where nobody signed up.
    const out: { day: string; count: number }[] = [];
    const cursor = new Date(since);
    cursor.setHours(0, 0, 0, 0);
    const today = new Date();
    while (cursor <= today) {
      const key = cursor.toISOString().slice(0, 10);
      out.push({ day: key, count: byDay.get(key) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  }

  private async ageDistribution() {
    const buckets = await Promise.all(
      AGE_BUCKETS.map(async ({ label, min, max }) => ({
        label,
        value: await this.prisma.profile.count({
          where: {
            dateOfBirth: {
              // Someone aged `min` was born on or before today minus `min`
              // years; someone aged `max` was born after today minus max+1.
              lte: yearsAgo(min),
              gt: yearsAgo(max + 1),
            },
          },
        }),
      })),
    );
    return buckets;
  }

  private async topLocations() {
    const rows = await this.prisma.profile.groupBy({
      by: ['city'],
      where: { city: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { city: 'desc' } },
      take: 8,
    });
    return rows.map((r) => ({
      label: r.city ?? 'Unknown',
      value: r._count._all,
    }));
  }
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function yearsAgo(years: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d;
}
