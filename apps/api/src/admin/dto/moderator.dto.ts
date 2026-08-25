import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Gender, Role } from '@prisma/client';

/** Roles that may be handed out from the Moderators screen. */
export const STAFF_ROLES = [
  Role.MODERATOR,
  Role.ADMIN,
  Role.SUPER_ADMIN,
] as const;

export class CreateModeratorDto {
  @IsEmail()
  email: string;

  /** Temporary password, handed over out of band; they can change it later. */
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsString() firstName: string;
  @IsString() lastName: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsDateString()
  dateOfBirth: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}

export class UpdateModeratorDto {
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ResetModeratorPasswordDto {
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;
}

export class ActivityQueryDto {
  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;
}
