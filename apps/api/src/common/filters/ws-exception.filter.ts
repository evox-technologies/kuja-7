import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Prisma } from '@prisma/client';
import { Socket } from 'socket.io';

/**
 * WebSocket exception filter — maps Prisma errors and generic runtime errors
 * to WsExceptions and emits a structured 'error' event to the client.
 * Applied at the gateway class level so all @SubscribeMessage handlers are covered.
 */
@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    if (exception instanceof WsException) {
      const error = exception.getError();
      const message =
        typeof error === 'string'
          ? error
          : ((error as { message?: string }).message ?? 'WebSocket error');
      this.logger.warn(`WsException for client=${client.id}: ${message}`);
      client.emit('error', { message });
      return;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = this.mapPrismaCode(exception.code);
      this.logger.error(
        `Prisma ${exception.code} in WS handler for client=${client.id} → ${mapped}`,
        exception.stack,
      );
      client.emit('error', { message: mapped });
      return;
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      this.logger.error(
        `PrismaValidationError in WS handler for client=${client.id}`,
        exception.stack,
      );
      client.emit('error', { message: 'Invalid request data' });
      return;
    }

    const message =
      exception instanceof Error ? exception.message : String(exception);
    const stack = exception instanceof Error ? exception.stack : undefined;
    this.logger.error(
      `Unhandled WS exception for client=${client.id}: ${message}`,
      stack,
    );
    client.emit('error', { message: 'An unexpected error occurred' });
  }

  private mapPrismaCode(code: string): string {
    switch (code) {
      case 'P2002':
        return 'A record with this value already exists';
      case 'P2025':
        return 'Record not found';
      case 'P2003':
        return 'Related record not found';
      default:
        return 'A database error occurred';
    }
  }
}
