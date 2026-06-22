import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  // Order matters: last registered = highest priority.
  // AllExceptionsFilter is the catch-all fallback; PrismaExceptionFilter takes
  // precedence for Prisma errors so they get specific HTTP codes instead of 500.
  app.useGlobalFilters(new AllExceptionsFilter(), new PrismaExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
  logger.log(`CORS origin: ${process.env.FRONTEND_URL ?? 'http://localhost:3000'}`);
}

void bootstrap();
