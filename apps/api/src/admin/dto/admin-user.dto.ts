import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Gender, Role, VerificationStatus } from '@prisma/client';

const PHONE = /^$|^\+?[0-9][0-9\s-]{6,18}$/;

/**
 * `forbidNonWhitelisted` is on globally, so an unknown query key is a 400 —
 * every filter the front-end sends must be declared here.
 */
export class ListUsersDto {
  /** Free text over first/last name, email and Kuja number. */
  @IsString()
  @IsOptional()
  @MaxLength(120)
  q?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsEnum(VerificationStatus)
  @IsOptional()
  verificationStatus?: VerificationStatus;

  // Checkbox filters arrive as the strings 'true'/'false'.
  @Transform(({ value }) =>
    value === undefined ? undefined : value === 'true' || value === true,
  )
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Transform(({ value }) =>
    value === undefined ? undefined : value === 'true' || value === true,
  )
  @IsBoolean()
  @IsOptional()
  isDummy?: boolean;

  @Transform(({ value }) =>
    value === undefined ? undefined : value === 'true' || value === true,
  )
  @IsBoolean()
  @IsOptional()
  profileCompleted?: boolean;

  /** Filter to the profiles one staff member added — drives the moderator drill-down. */
  @IsString()
  @IsOptional()
  createdById?: string;

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @IsIn(['newest', 'oldest', 'name'])
  @IsOptional()
  sort?: 'newest' | 'oldest' | 'name';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number;
}

/**
 * Creating a member from the admin portal. Mirrors CreateProfileDto field for
 * field — the repo hand-duplicates DTOs rather than using PartialType — plus
 * `isDummy`, and without the Supabase session that POST /auth/profile relies on.
 */
export class AdminCreateUserDto {
  @IsString() firstName: string;
  @IsString() lastName: string;
  @IsEmail() email: string;
  @IsEnum(Gender) gender: Gender;
  @IsDateString() dateOfBirth: string;

  /** Sample profile: no auth user, and auto-reciprocates interests and contact requests. */
  @IsBoolean()
  @IsOptional()
  isDummy?: boolean;

  @IsString() @IsOptional() religion?: string;
  @IsString() @IsOptional() profession?: string;
  @IsString() @IsOptional() location?: string;
  @IsString() @IsOptional() bio?: string;
  @IsString() @IsOptional() avatarUrl?: string;
  @IsString() @IsOptional() nationality?: string;
  @IsString() @IsOptional() height?: string;
  @IsString() @IsOptional() ethnicity?: string;
  @IsString() @IsOptional() caste?: string;
  @IsString() @IsOptional() civilStatus?: string;
  @IsString() @IsOptional() country?: string;
  @IsString() @IsOptional() city?: string;
  @IsString() @IsOptional() stateDistrict?: string;
  @IsString() @IsOptional() educationLevel?: string;
  @IsString() @IsOptional() drinking?: string;
  @IsString() @IsOptional() smoking?: string;
  @IsString() @IsOptional() foodPreference?: string;
  @IsString() @IsOptional() kujaNumber?: string;
  @IsString() @IsOptional() birthDay?: string;

  @IsString()
  @IsOptional()
  @Matches(PHONE, { message: 'Invalid mobile number' })
  mobileNumber?: string;

  @IsString()
  @IsOptional()
  @Matches(PHONE, { message: 'Invalid WhatsApp number' })
  whatsappNumber?: string;

  @IsString() @IsOptional() address?: string;
  @IsArray() @IsOptional() images?: string[];
}

/**
 * Editing a member. Unlike PATCH /auth/me this may change gender and date of
 * birth — staff correcting a data-entry mistake need to. Role is deliberately
 * absent: role changes go through the moderators module so they are audited as
 * such.
 */
export class AdminUpdateUserDto {
  @IsString() @IsOptional() firstName?: string;
  @IsString() @IsOptional() lastName?: string;
  @IsEmail() @IsOptional() email?: string;
  @IsEnum(Gender) @IsOptional() gender?: Gender;
  @IsDateString() @IsOptional() dateOfBirth?: string;
  @IsString() @IsOptional() religion?: string;
  @IsString() @IsOptional() profession?: string;
  @IsString() @IsOptional() location?: string;
  @IsString() @IsOptional() bio?: string;
  @IsString() @IsOptional() avatarUrl?: string;
  @IsString() @IsOptional() nationality?: string;
  @IsString() @IsOptional() height?: string;
  @IsString() @IsOptional() ethnicity?: string;
  @IsString() @IsOptional() caste?: string;
  @IsString() @IsOptional() civilStatus?: string;
  @IsString() @IsOptional() country?: string;
  @IsString() @IsOptional() city?: string;
  @IsString() @IsOptional() stateDistrict?: string;
  @IsString() @IsOptional() educationLevel?: string;
  @IsString() @IsOptional() drinking?: string;
  @IsString() @IsOptional() smoking?: string;
  @IsString() @IsOptional() foodPreference?: string;
  @IsString() @IsOptional() kujaNumber?: string;
  @IsString() @IsOptional() birthDay?: string;

  @IsString()
  @IsOptional()
  @Matches(PHONE, { message: 'Invalid mobile number' })
  mobileNumber?: string;

  @IsString()
  @IsOptional()
  @Matches(PHONE, { message: 'Invalid WhatsApp number' })
  whatsappNumber?: string;

  @IsString() @IsOptional() address?: string;
  @IsArray() @IsOptional() images?: string[];
  @IsBoolean() @IsOptional() isDummy?: boolean;
}

export class SetVerificationDto {
  @IsEnum(VerificationStatus)
  status: VerificationStatus;

  /** Required by the service when status is REJECTED. */
  @IsString()
  @IsOptional()
  @MaxLength(500)
  rejectionReason?: string;
}

export class SetActiveDto {
  @IsBoolean()
  isActive: boolean;
}
