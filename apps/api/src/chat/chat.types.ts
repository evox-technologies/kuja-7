import type { Profile } from '@prisma/client';
import type { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  profile: Profile;
}
