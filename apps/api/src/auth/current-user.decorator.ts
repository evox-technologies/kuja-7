import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { Profile } from '@prisma/client';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Profile | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user;
  },
);
