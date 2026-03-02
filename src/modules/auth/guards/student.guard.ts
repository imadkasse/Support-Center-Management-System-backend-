import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '@prisma/client';

@Injectable()
export class StudentGuard extends RolesGuard {
  constructor(reflector: Reflector) {
    super(reflector, [UserRole.STUDENT]);
  }
}
