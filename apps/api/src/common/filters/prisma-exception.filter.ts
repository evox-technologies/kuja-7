import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientValidationError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handleKnownError(exception, response);
    }

    // PrismaClientValidationError – bad query shape, usually a developer bug
    const firstLine = exception.message.split('\n')[0];
    this.logger.warn(`PrismaValidationError → 400 Bad Request | ${firstLine}`);
    return response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'Bad Request',
      message: 'Invalid query parameters',
    });
  }

  private handleKnownError(
    exception: Prisma.PrismaClientKnownRequestError,
    response: Response,
  ) {
    const { code, meta } = exception;
    const target =
      (meta?.target as string[] | string | undefined) ??
      meta?.field_name ??
      meta?.modelName ??
      'unknown';

    switch (code) {
      case 'P2002': {
        this.logger.warn(
          `P2002 unique constraint violated · target: ${JSON.stringify(target)} → 409 Conflict`,
        );
        return response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: 'A record with this value already exists',
        });
      }

      case 'P2025': {
        const cause = (meta?.cause as string | undefined) ?? 'Record not found';
        this.logger.warn(`P2025 record not found · ${cause} → 404 Not Found`);
        return response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          message: cause,
        });
      }

      case 'P2003': {
        this.logger.error(
          `P2003 foreign key constraint failed · field: ${JSON.stringify(target)} → 400 Bad Request`,
          exception.stack,
        );
        return response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Related record not found',
        });
      }

      case 'P2000': {
        this.logger.error(
          `P2000 value too long · field: ${JSON.stringify(target)} → 400 Bad Request`,
          exception.stack,
        );
        return response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Input value exceeds maximum length',
        });
      }

      case 'P2016': {
        this.logger.error(
          `P2016 query interpretation error · ${exception.message.split('\n')[0]} → 400 Bad Request`,
          exception.stack,
        );
        return response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Query interpretation error',
        });
      }

      default: {
        this.logger.error(
          `Prisma ${code} · unhandled DB error → 500 Internal Server Error`,
          exception.stack,
        );
        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Internal Server Error',
          message: 'An unexpected database error occurred',
        });
      }
    }
  }
}
