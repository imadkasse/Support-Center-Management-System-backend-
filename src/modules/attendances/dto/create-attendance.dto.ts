import {
  IsInt,
  IsPositive,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class CreateAttendanceDto {
  @IsInt()
  @IsPositive()
  studentId: number;

  @IsInt()
  @IsPositive()
  classId: number;

  @IsDateString()
  date: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
