import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Gender } from '@prisma/client';
import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchProfilesDto {
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsInt()
  @Min(18)
  @Type(() => Number)
  ageMin?: number;

  @IsOptional()
  @IsInt()
  @Max(80)
  @Type(() => Number)
  ageMax?: number;

  @IsOptional()
  @IsString()
  religion?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async search(dto: SearchProfilesDto, requesterId: string) {
    const page = dto.page ?? 1;
    const take = 20;
    const skip = (page - 1) * take;

    const now = new Date();
    const where: Record<string, unknown> = {
      id: { not: requesterId },
      isActive: true,
      isVerified: true,
    };

    if (dto.gender) where.gender = dto.gender;
    if (dto.religion) where.religion = dto.religion;
    if (dto.location)
      where.location = { contains: dto.location, mode: 'insensitive' };

    if (dto.ageMin || dto.ageMax) {
      where.dateOfBirth = {
        ...(dto.ageMax && {
          gte: new Date(
            now.getFullYear() - dto.ageMax,
            now.getMonth(),
            now.getDate(),
          ),
        }),
        ...(dto.ageMin && {
          lte: new Date(
            now.getFullYear() - dto.ageMin,
            now.getMonth(),
            now.getDate(),
          ),
        }),
      };
    }

    const [profiles, total] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          gender: true,
          dateOfBirth: true,
          religion: true,
          profession: true,
          location: true,
          avatarUrl: true,
          isVerified: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.profile.count({ where }),
    ]);

    return { profiles, total, page, totalPages: Math.ceil(total / take) };
  }

  async chatSearch(q: string, requesterId: string) {
    return this.prisma.profile.findMany({
      where: {
        id: { not: requesterId },
        isActive: true,
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      take: 10,
    });
  }

  async findOne(id: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        dateOfBirth: true,
        religion: true,
        profession: true,
        location: true,
        bio: true,
        avatarUrl: true,
        isVerified: true,
      },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }
}
