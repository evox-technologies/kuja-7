import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';

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
      },
    });
  }

  async getProfile(supabaseId: string) {
    return this.prisma.profile.findUnique({ where: { supabaseId } });
  }
}
