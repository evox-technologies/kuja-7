import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async createProfile(supabaseId: string, dto: CreateProfileDto) {
    const existing = await this.prisma.profile.findUnique({
      where: { supabaseId },
    });

    if (existing) throw new ConflictException('Profile already exists');

    return this.prisma.profile.create({
      data: {
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
      },
    });
  }

  async updateProfile(supabaseId: string, dto: UpdateProfileDto) {
    return this.prisma.profile.update({
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
        ...(dto.stateDistrict !== undefined && { stateDistrict: dto.stateDistrict }),
        ...(dto.educationLevel !== undefined && { educationLevel: dto.educationLevel }),
        ...(dto.drinking !== undefined && { drinking: dto.drinking }),
        ...(dto.smoking !== undefined && { smoking: dto.smoking }),
        ...(dto.foodPreference !== undefined && { foodPreference: dto.foodPreference }),
        ...(dto.kujaNumber !== undefined && { kujaNumber: dto.kujaNumber }),
        ...(dto.birthDay !== undefined && { birthDay: dto.birthDay }),
        ...(dto.mobileNumber !== undefined && { mobileNumber: dto.mobileNumber }),
        ...(dto.whatsappNumber !== undefined && { whatsappNumber: dto.whatsappNumber }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.images !== undefined && { images: dto.images }),
      },
    });
  }

  async getProfile(supabaseId: string) {
    return this.prisma.profile.findUnique({ where: { supabaseId } });
  }
}
