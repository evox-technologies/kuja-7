import {
  IsString,
  IsEmail,
  IsEnum,
  IsDateString,
  IsOptional,
  IsArray,
  Matches,
} from 'class-validator';
import { Gender } from '@prisma/client';

export class CreateProfileDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsDateString()
  dateOfBirth: string;

  @IsString()
  @IsOptional()
  religion?: string;

  @IsString()
  @IsOptional()
  profession?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  // Extended personal info
  @IsString()
  @IsOptional()
  nationality?: string;

  @IsString()
  @IsOptional()
  height?: string;

  @IsString()
  @IsOptional()
  ethnicity?: string;

  @IsString()
  @IsOptional()
  caste?: string;

  @IsString()
  @IsOptional()
  civilStatus?: string;

  // Residency
  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  stateDistrict?: string;

  // Education & habits
  @IsString()
  @IsOptional()
  educationLevel?: string;

  @IsString()
  @IsOptional()
  drinking?: string;

  @IsString()
  @IsOptional()
  smoking?: string;

  @IsString()
  @IsOptional()
  foodPreference?: string;

  // Horoscope
  @IsString()
  @IsOptional()
  kujaNumber?: string;

  @IsString()
  @IsOptional()
  birthDay?: string;

  // Private contact
  @IsString()
  @IsOptional()
  @Matches(/^$|^\+?[0-9][0-9\s-]{6,18}$/, { message: 'Invalid mobile number' })
  mobileNumber?: string;

  @IsString()
  @IsOptional()
  @Matches(/^$|^\+?[0-9][0-9\s-]{6,18}$/, {
    message: 'Invalid WhatsApp number',
  })
  whatsappNumber?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsArray()
  @IsOptional()
  images?: string[];
}
