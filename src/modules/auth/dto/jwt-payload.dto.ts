import { UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}
