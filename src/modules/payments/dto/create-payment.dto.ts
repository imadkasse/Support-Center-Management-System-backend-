import { IsInt, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsInt()
  @Min(1)
  studentId: number;

  @IsInt()
  @Min(1)
  classId: number;

  @IsInt()
  @Min(0)
  amountPaid: number;
}
