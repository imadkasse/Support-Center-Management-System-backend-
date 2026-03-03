import {
  IsInt,
  IsPositive,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@prisma/client';

export class BulkAttendanceItemDto {
  @IsInt()
  @IsPositive()
  studentId: number;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkAttendanceDto {
  @IsInt()
  @IsPositive()
  classId: number;

  @IsDateString()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkAttendanceItemDto)
  attendances: BulkAttendanceItemDto[];
}
