import type { Profile } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: Profile;
      supabaseId?: string;
    }
  }
}

export {};
