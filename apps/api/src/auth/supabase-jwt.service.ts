import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseJwtService {
  private readonly supabaseUrl: string;

  constructor(config: ConfigService) {
    this.supabaseUrl = config.getOrThrow('SUPABASE_URL');
  }

  async verifyToken(token: string): Promise<{ sub: string }> {
    const { jwtVerify, createRemoteJWKSet } = await import('jose');
    const JWKS = createRemoteJWKSet(
      new URL(`${this.supabaseUrl}/auth/v1/.well-known/jwks.json`),
    );
    const { payload } = await jwtVerify(token, JWKS, { algorithms: ['ES256'] });
    return { sub: payload.sub! };
  }
}
