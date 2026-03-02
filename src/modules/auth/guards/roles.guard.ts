import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '@prisma/client';

type AuthUser = {
  role: UserRole;
};

@Injectable()
export class RolesGuard implements CanActivate {
  private requiredRoles: UserRole[] | null;

  constructor(
    private reflector: Reflector,
    requiredRoles?: UserRole[],
  ) {
    this.requiredRoles = requiredRoles ?? null;
  }

  canActivate(context: ExecutionContext): boolean {
    const decoratorRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredRoles = this.requiredRoles ?? decoratorRoles;
    if (!requiredRoles) {
      return true;
    }

    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    const request = context.switchToHttp().getRequest();

    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    const user = request.user as AuthUser | undefined;
    if (!user || !user.role) {
      return false;
    }
    return requiredRoles.some((role) => user.role === role);
  }
}
