import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseJwtService } from './supabase-jwt.service';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(OptionalJwtAuthGuard.name);

  constructor(
    private readonly jwtService: SupabaseJwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return true;

    const token = auth.slice(7);

    try {
      const payload = await this.jwtService.verifyToken(token);
      const profile = await this.prisma.profile.findUnique({
        where: { supabaseId: payload.sub },
      });

      if (profile?.isActive) {
        req.user = profile;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.debug(`Ignoring invalid/expired token: ${message}`);
    }

    return true;
  }
}
