import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminGuard extends RolesGuard {
  constructor(reflector: Reflector) {
    super(reflector, [UserRole.ADMIN]);
  }
}
