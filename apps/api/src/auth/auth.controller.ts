import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtTokenGuard } from './jwt-token.guard';
import { CurrentUser } from './current-user.decorator';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { Profile } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('profile')
  @UseGuards(JwtTokenGuard)
  @HttpCode(HttpStatus.CREATED)
  createProfile(@Req() req: Request, @Body() dto: CreateProfileDto) {
    return this.authService.createProfile(req.supabaseId!, dto);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser() user: Profile, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.supabaseId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: Profile) {
    return user;
  }
}
