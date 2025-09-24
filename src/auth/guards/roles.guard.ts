import { ROLES_KEY } from '@common/decorators/roles.decorator';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { UserDto } from '@common/dto';

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

    const req = context.switchToHttp().getRequest();
    const user: UserDto | undefined = req?.user;

    // Normalize roles to a lowercased array; our UserDto defines a single 'rol' string
    const userRoles: string[] = user?.rol
      ? [String(user.rol).toLowerCase()]
      : [];

    const has = required.some((role) => userRoles.includes(role.toLowerCase()));

    if (!has) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
