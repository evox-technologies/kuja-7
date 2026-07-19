import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseJwtService } from './supabase-jwt.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly jwtService: SupabaseJwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      this.logger.warn('Missing or malformed Authorization header');
      throw new UnauthorizedException();
    }

    const token = auth.slice(7);

    try {
      const payload = await this.jwtService.verifyToken(token);
      this.logger.debug(`Token verified for sub=${payload.sub}`);

      const profile = await this.prisma.profile.findUnique({
        where: { supabaseId: payload.sub },
      });

      if (!profile) {
        this.logger.warn(`No profile found for supabaseId=${payload.sub}`);
        throw new NotFoundException('Profile not found');
      }
      if (!profile.isActive) {
        this.logger.warn(`Profile inactive for supabaseId=${payload.sub}`);
        throw new UnauthorizedException('Profile inactive');
      }

      req.user = profile;
      return true;
    } catch (err: unknown) {
      if (
        err instanceof UnauthorizedException ||
        err instanceof NotFoundException
      )
        throw err;
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(`Auth error: ${message}`, stack);
      throw new UnauthorizedException();
    }
  }
}
