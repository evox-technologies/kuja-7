import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtTokenGuard } from './jwt-token.guard';
import { RolesGuard } from './roles.guard';
import { SupabaseJwtService } from './supabase-jwt.service';

@Module({
  providers: [
    AuthService,
    JwtAuthGuard,
    JwtTokenGuard,
    RolesGuard,
    SupabaseJwtService,
  ],
  controllers: [AuthController],
  exports: [JwtAuthGuard, JwtTokenGuard, RolesGuard, SupabaseJwtService],
})
export class AuthModule {}
