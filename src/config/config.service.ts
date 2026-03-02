import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  get databaseUrl(): string {
    return process.env.DATABASE_URL!;
  }

  get jwtSecret(): string {
    return process.env.JWT_SECRET!;
  }

  get jwtExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN!;
  }

  get port(): number {
    return parseInt(process.env.PORT || '3000', 10);
  }

  get nodeEnv(): string {
    return process.env.NODE_ENV || 'development';
  }
}
