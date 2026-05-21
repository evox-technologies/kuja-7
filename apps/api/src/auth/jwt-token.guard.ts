import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseJwtService } from './supabase-jwt.service';

@Injectable()
export class JwtTokenGuard implements CanActivate {
  private readonly logger = new Logger(JwtTokenGuard.name);

  constructor(private readonly jwtService: SupabaseJwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException();

    const token = auth.slice(7);
    try {
      const payload = await this.jwtService.verifyToken(token);
      req.supabaseId = payload.sub;
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Token verification failed: ${message}`);
      throw new UnauthorizedException();
    }
  }
}
