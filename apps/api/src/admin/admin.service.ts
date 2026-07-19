import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async listUsers(page = 1) {
    this.logger.log(`listUsers – page=${page}`);

    const take = 30;
    const skip = (page - 1) * take;
    const [profiles, total] = await Promise.all([
      this.prisma.profile.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.profile.count(),
    ]);

    this.logger.log(
      `listUsers – returned ${profiles.length}/${total} profile(s)`,
    );
    return { profiles, total, page, totalPages: Math.ceil(total / take) };
  }

  async verifyProfile(id: string) {
    this.logger.log(`verifyProfile – id=${id}`);

    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) {
      this.logger.warn(`verifyProfile – profile not found: id=${id}`);
      throw new NotFoundException('Profile not found');
    }

    const updated = await this.prisma.profile.update({
      where: { id },
      data: { isVerified: true },
    });

    this.logger.log(`verifyProfile – profile verified: id=${id}`);
    return updated;
  }

  async deactivateProfile(id: string) {
    this.logger.log(`deactivateProfile – id=${id}`);

    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) {
      this.logger.warn(`deactivateProfile – profile not found: id=${id}`);
      throw new NotFoundException('Profile not found');
    }

    const updated = await this.prisma.profile.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log(`deactivateProfile – profile deactivated: id=${id}`);
    return updated;
  }

  async stats() {
    this.logger.log('stats – fetching platform statistics');

    const [totalUsers, verified, pending] = await Promise.all([
      this.prisma.profile.count(),
      this.prisma.profile.count({ where: { isVerified: true } }),
      this.prisma.profile.count({
        where: { isVerified: false, isActive: true },
      }),
    ]);

    this.logger.log(
      `stats – total=${totalUsers} verified=${verified} pendingVerification=${pending}`,
    );
    return { totalUsers, verified, pendingVerification: pending };
  }
}
