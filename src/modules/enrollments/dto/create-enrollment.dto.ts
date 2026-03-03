import { IsInt, IsPositive, IsNumber } from 'class-validator';

export class CreateEnrollmentDto {
  @IsInt()
  @IsPositive()
  studentId: number;

  @IsInt()
  @IsPositive()
  classId: number;

  @IsNumber()
  @IsPositive()
  amountPaid: number;
}
