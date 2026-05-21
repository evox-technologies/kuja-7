import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import type { AuthenticatedSocket } from './chat.types';

// Connections are authenticated in handleConnection — this guard just
// ensures the socket was not disconnected due to a bad token.
@Injectable()
export class WsJwtGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const client = ctx.switchToWs().getClient<Socket>();
    const profile = (client as unknown as Partial<AuthenticatedSocket>).profile;
    if (!profile) throw new WsException('Unauthorized');
    return true;
  }
}
