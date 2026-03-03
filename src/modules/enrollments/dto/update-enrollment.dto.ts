import { IsOptional, IsBoolean, IsEnum, IsDateString } from 'class-validator';
import { EnrollmentStatus } from '@prisma/client';

export class UpdateEnrollmentDto {
  @IsOptional()
  @IsBoolean()
  paymentConfirmed?: boolean;

  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  @IsOptional()
  @IsDateString()
  subscriptionEnd?: string;
}
