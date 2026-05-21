import {
  IsString,
  IsEmail,
  IsEnum,
  IsDateString,
  IsOptional,
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
}
