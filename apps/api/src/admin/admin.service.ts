import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async listUsers(page = 1) {
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
    return { profiles, total, page, totalPages: Math.ceil(total / take) };
  }

  async verifyProfile(id: string) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Profile not found');
    return this.prisma.profile.update({
      where: { id },
      data: { isVerified: true },
    });
  }

  async deactivateProfile(id: string) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Profile not found');
    return this.prisma.profile.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async stats() {
    const [totalUsers, verified, pending] = await Promise.all([
      this.prisma.profile.count(),
      this.prisma.profile.count({ where: { isVerified: true } }),
      this.prisma.profile.count({
        where: { isVerified: false, isActive: true },
      }),
    ]);
    return { totalUsers, verified, pendingVerification: pending };
  }
}
