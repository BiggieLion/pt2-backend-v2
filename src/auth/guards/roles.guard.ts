import { ROLES_KEY } from '@common/decorators/roles.decorator';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { UserDto } from '@common/dto';
import { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const req: Request = context.switchToHttp().getRequest();
    const user = req.user as UserDto | undefined;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }
    // Normalize roles to a lowercased array; our UserDto defines a single 'rol' string
    const userRoles: string[] = user?.rol
      ? [String(user.rol).toLowerCase()]
      : [];

    if (userRoles.length === 0) {
      throw new ForbiddenException('User has no roles assigned');
    }

    const has = required.some((role) => userRoles.includes(role.toLowerCase()));

    if (!has) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
