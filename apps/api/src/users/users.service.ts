import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Gender, Prisma } from '@prisma/client';
import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { parseHeightToInches } from './height.util';

export class SearchProfilesDto {
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  @Type(() => Number)
  ageMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  @Type(() => Number)
  ageMax?: number;

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(120)
  @Type(() => Number)
  heightMin?: number;

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(120)
  @Type(() => Number)
  heightMax?: number;

  @IsOptional()
  @IsString()
  religion?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  ethnicity?: string;

  @IsOptional()
  @IsString()
  civilStatus?: string;

  @IsOptional()
  @IsString()
  educationLevel?: string;

  @IsOptional()
  @IsString()
  drinking?: string;

  @IsOptional()
  @IsString()
  smoking?: string;

  @IsOptional()
  @IsString()
  foodPreference?: string;

  @IsOptional()
  @IsString()
  kujaNumber?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;
}

// Matches the fixed ethnicity list offered in the UI dropdowns (apps/web) minus 'Other'.
const KNOWN_ETHNICITIES = ['Sinhalese', 'Tamil', 'Muslim', 'Burgher'];

const PUBLIC_PROFILE_SELECT = {
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
  nationality: true,
  height: true,
  ethnicity: true,
  caste: true,
  civilStatus: true,
  country: true,
  city: true,
  stateDistrict: true,
  educationLevel: true,
  drinking: true,
  smoking: true,
  foodPreference: true,
  kujaNumber: true,
  birthDay: true,
  images: true,
  createdAt: true,
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async search(dto: SearchProfilesDto, requesterId?: string) {
    this.logger.log(
      `search – requesterId=${requesterId ?? 'anonymous'} page=${dto.page ?? 1}`,
    );

    const page = dto.page ?? 1;
    const take = 20;
    const skip = (page - 1) * take;

    const now = new Date();
    const where: Record<string, unknown> = {
      isActive: true,
      isVerified: true,
    };
    if (requesterId) where.id = { not: requesterId };

    if (dto.gender) where.gender = dto.gender;
    if (dto.religion)
      where.religion = { contains: dto.religion, mode: 'insensitive' };
    if (dto.location)
      where.location = { contains: dto.location, mode: 'insensitive' };
    if (dto.country)
      where.country = { contains: dto.country, mode: 'insensitive' };
    if (dto.city) where.city = { contains: dto.city, mode: 'insensitive' };
    if (dto.ethnicity) {
      // 'Other' covers both non-standard ethnicities and profiles that never set one.
      if (dto.ethnicity === 'Other') {
        where.OR = [
          { ethnicity: null },
          { ethnicity: '' },
          { ethnicity: { notIn: KNOWN_ETHNICITIES } },
        ];
      } else {
        where.ethnicity = { contains: dto.ethnicity, mode: 'insensitive' };
      }
    }
    if (dto.civilStatus) where.civilStatus = dto.civilStatus;
    if (dto.educationLevel) where.educationLevel = dto.educationLevel;
    if (dto.drinking) where.drinking = dto.drinking;
    if (dto.smoking) where.smoking = dto.smoking;
    if (dto.foodPreference) where.foodPreference = dto.foodPreference;
    if (dto.kujaNumber) where.kujaNumber = dto.kujaNumber;

    if (dto.ageMin || dto.ageMax) {
      where.dateOfBirth = {
        // "age <= ageMax" means not yet reached the (ageMax+1)th birthday, i.e.
        // born strictly after the date exactly (ageMax+1) years ago — using
        // ageMax years with `gte` excludes anyone whose birthday this year has
        // already passed (e.g. born in January vs. today being in August),
        // even though they're still exactly ageMax.
        ...(dto.ageMax && {
          gt: new Date(
            now.getFullYear() - (dto.ageMax + 1),
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

    // height is free text (onboarding accepts "5ft 8in", "5' 8\"", etc.), so a range
    // can't be expressed as a Prisma `where` clause — filter in app code instead. That
    // breaks DB-level pagination, so when a height filter is present we fetch every
    // profile matching the other criteria and paginate the filtered array ourselves.
    const hasHeightFilter = dto.heightMin != null || dto.heightMax != null;

    let profiles: Array<
      Prisma.ProfileGetPayload<{ select: typeof PUBLIC_PROFILE_SELECT }>
    >;
    let total: number;

    if (hasHeightFilter) {
      const heightMin = dto.heightMin ?? -Infinity;
      const heightMax = dto.heightMax ?? Infinity;

      const all = await this.prisma.profile.findMany({
        where,
        select: PUBLIC_PROFILE_SELECT,
        orderBy: { createdAt: 'desc' },
      });

      const filtered = all.filter((p) => {
        const inches = parseHeightToInches(p.height);
        return inches != null && inches >= heightMin && inches <= heightMax;
      });

      total = filtered.length;
      profiles = filtered.slice(skip, skip + take);
    } else {
      [profiles, total] = await Promise.all([
        this.prisma.profile.findMany({
          where,
          skip,
          take,
          select: PUBLIC_PROFILE_SELECT,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.profile.count({ where }),
      ]);
    }

    const interests = requesterId
      ? await this.prisma.interest.findMany({
          where: {
            senderId: requesterId,
            receiverId: { in: profiles.map((p) => p.id) },
          },
          select: { receiverId: true, status: true },
        })
      : [];
    const interestMap = new Map(interests.map((i) => [i.receiverId, i.status]));

    this.logger.log(
      `search – returned ${profiles.length}/${total} profile(s) for requesterId=${requesterId ?? 'anonymous'}`,
    );

    return {
      profiles: profiles.map((p) => ({
        ...p,
        myInterestStatus: interestMap.get(p.id) ?? null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / take),
    };
  }

  async chatSearch(q: string, requesterId: string) {
    this.logger.log(`chatSearch – query="${q}" requesterId=${requesterId}`);

    const results = await this.prisma.profile.findMany({
      where: {
        id: { not: requesterId },
        isActive: true,
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        avatarUrl: true,
      },
      take: 10,
    });

    this.logger.log(
      `chatSearch – returned ${results.length} result(s) for query="${q}"`,
    );
    return results;
  }

  async findOne(id: string, requesterId?: string) {
    this.logger.log(
      `findOne – profileId=${id} requesterId=${requesterId ?? 'anonymous'}`,
    );

    const profile = await this.prisma.profile.findUnique({
      where: { id },
      select: {
        ...PUBLIC_PROFILE_SELECT,
        mobileNumber: true,
        whatsappNumber: true,
        address: true,
      },
    });

    if (!profile) {
      this.logger.warn(`findOne – profile not found: id=${id}`);
      throw new NotFoundException('Profile not found');
    }

    if (!requesterId) {
      return {
        ...profile,
        mobileNumber: null,
        whatsappNumber: null,
        address: null,
        _relationship: {
          isMutual: false,
          myInterestStatus: null,
          myInterestId: null,
          theirInterestStatus: null,
          theirInterestId: null,
          myContactRequestStatus: null,
          theirContactRequestStatus: null,
        },
      };
    }

    // Fetch all relationship data in one round-trip
    const [myInterest, theirInterest, contactRequest, incomingContactRequest] =
      await Promise.all([
        this.prisma.interest.findFirst({
          where: { senderId: requesterId, receiverId: id },
          select: { id: true, status: true },
        }),
        this.prisma.interest.findFirst({
          where: { senderId: id, receiverId: requesterId },
          select: { id: true, status: true },
        }),
        this.prisma.contactRequest.findUnique({
          where: { requesterId_targetId: { requesterId, targetId: id } },
          select: { status: true },
        }),
        this.prisma.contactRequest.findUnique({
          where: {
            requesterId_targetId: { requesterId: id, targetId: requesterId },
          },
          select: { status: true },
        }),
      ]);

    // An interest accepted in either direction is a match — only the accepted
    // side gets a row, so requiring both would never be true.
    const isMutual =
      myInterest?.status === 'ACCEPTED' || theirInterest?.status === 'ACCEPTED';

    const contactVisible =
      isMutual &&
      contactRequest?.status === 'ACCEPTED' &&
      incomingContactRequest?.status === 'ACCEPTED';

    return {
      ...profile,
      mobileNumber: contactVisible ? profile.mobileNumber : null,
      whatsappNumber: contactVisible ? profile.whatsappNumber : null,
      address: contactVisible ? profile.address : null,
      _relationship: {
        isMutual,
        myInterestStatus: myInterest?.status ?? null,
        myInterestId: myInterest?.id ?? null,
        theirInterestStatus: theirInterest?.status ?? null,
        theirInterestId: theirInterest?.id ?? null,
        myContactRequestStatus: contactRequest?.status ?? null,
        theirContactRequestStatus: incomingContactRequest?.status ?? null,
      },
    };
  }
}
