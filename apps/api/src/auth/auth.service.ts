import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { Profile } from '@prisma/client';

function computeProfileCompleted(p: Partial<Profile>): boolean {
  return !!(
    p.firstName?.trim() &&
    p.lastName?.trim() &&
    p.mobileNumber?.trim() &&
    p.address?.trim() &&
    p.dateOfBirth &&
    p.gender &&
    p.height?.trim() &&
    p.country?.trim() &&
    p.city?.trim() &&
    p.educationLevel?.trim() &&
    p.profession?.trim() &&
    p.kujaNumber?.trim() &&
    p.birthDay?.trim()
  );
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private prisma: PrismaService) {}

  async createProfile(supabaseId: string, dto: CreateProfileDto) {
    const existing = await this.prisma.profile.findUnique({
      where: { supabaseId },
    });

    if (existing) {
      this.logger.warn(
        `createProfile – profile already exists for supabaseId=${supabaseId}`,
      );
      throw new ConflictException('Profile already exists');
    }

    const data = {
      supabaseId,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      gender: dto.gender,
      dateOfBirth: new Date(dto.dateOfBirth),
      religion: dto.religion,
      profession: dto.profession,
      location: dto.location,
      bio: dto.bio,
      avatarUrl: dto.avatarUrl,
      nationality: dto.nationality,
      height: dto.height,
      ethnicity: dto.ethnicity,
      caste: dto.caste,
      civilStatus: dto.civilStatus,
      country: dto.country,
      city: dto.city,
      stateDistrict: dto.stateDistrict,
      educationLevel: dto.educationLevel,
      drinking: dto.drinking,
      smoking: dto.smoking,
      foodPreference: dto.foodPreference,
      kujaNumber: dto.kujaNumber,
      birthDay: dto.birthDay,
      mobileNumber: dto.mobileNumber,
      whatsappNumber: dto.whatsappNumber,
      address: dto.address,
      images: dto.images ?? [],
    };

    const profile = await this.prisma.profile.create({
      data: {
        ...data,
        profileCompleted: computeProfileCompleted(data as Partial<Profile>),
      },
    });

    this.logger.log(
      `createProfile – created: id=${profile.id} profileCompleted=${profile.profileCompleted}`,
    );
    return profile;
  }

  async updateProfile(supabaseId: string, dto: UpdateProfileDto) {
    this.logger.log(
      `updateProfile – updating profile for supabaseId=${supabaseId}`,
    );

    // Fetch current values so we can compute profileCompleted across the full merged state
    const current = await this.prisma.profile.findUniqueOrThrow({
      where: { supabaseId },
    });

    const merged: Partial<Profile> = {
      firstName: dto.firstName ?? current.firstName,
      lastName: dto.lastName ?? current.lastName,
      mobileNumber: dto.mobileNumber ?? current.mobileNumber,
      address: dto.address ?? current.address,
      dateOfBirth: current.dateOfBirth,
      gender: current.gender,
      height: dto.height ?? current.height,
      country: dto.country ?? current.country,
      city: dto.city ?? current.city,
      educationLevel: dto.educationLevel ?? current.educationLevel,
      profession: dto.profession ?? current.profession,
      kujaNumber: dto.kujaNumber ?? current.kujaNumber,
      birthDay: dto.birthDay ?? current.birthDay,
    };

    const profile = await this.prisma.profile.update({
      where: { supabaseId },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.religion !== undefined && { religion: dto.religion }),
        ...(dto.profession !== undefined && { profession: dto.profession }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.nationality !== undefined && { nationality: dto.nationality }),
        ...(dto.height !== undefined && { height: dto.height }),
        ...(dto.ethnicity !== undefined && { ethnicity: dto.ethnicity }),
        ...(dto.caste !== undefined && { caste: dto.caste }),
        ...(dto.civilStatus !== undefined && { civilStatus: dto.civilStatus }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.stateDistrict !== undefined && {
          stateDistrict: dto.stateDistrict,
        }),
        ...(dto.educationLevel !== undefined && {
          educationLevel: dto.educationLevel,
        }),
        ...(dto.drinking !== undefined && { drinking: dto.drinking }),
        ...(dto.smoking !== undefined && { smoking: dto.smoking }),
        ...(dto.foodPreference !== undefined && {
          foodPreference: dto.foodPreference,
        }),
        ...(dto.kujaNumber !== undefined && { kujaNumber: dto.kujaNumber }),
        ...(dto.birthDay !== undefined && { birthDay: dto.birthDay }),
        ...(dto.mobileNumber !== undefined && {
          mobileNumber: dto.mobileNumber,
        }),
        ...(dto.whatsappNumber !== undefined && {
          whatsappNumber: dto.whatsappNumber,
        }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.images !== undefined && { images: dto.images }),
        profileCompleted: computeProfileCompleted(merged),
      },
    });

    this.logger.log(
      `updateProfile – updated: id=${profile.id} profileCompleted=${profile.profileCompleted}`,
    );
    return profile;
  }

  async getProfile(supabaseId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { supabaseId },
    });

    if (!profile) {
      this.logger.warn(
        `getProfile – no profile found for supabaseId=${supabaseId}`,
      );
    }

    return profile;
  }
}
