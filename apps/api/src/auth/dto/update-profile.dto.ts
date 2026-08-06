import { IsString, IsOptional, IsArray, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

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

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  stateDistrict?: string;

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

  @IsString()
  @IsOptional()
  kujaNumber?: string;

  @IsString()
  @IsOptional()
  birthDay?: string;

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
