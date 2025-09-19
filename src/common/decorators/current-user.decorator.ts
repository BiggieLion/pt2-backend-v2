import { UserDto } from '@common/dto';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const extractCurrentUser = (
  _data: unknown,
  ctx: ExecutionContext,
): UserDto | undefined => {
  const req: Request = ctx.switchToHttp().getRequest();
  return req.user as UserDto | undefined;
};

export const CurrentUser = createParamDecorator(extractCurrentUser);
