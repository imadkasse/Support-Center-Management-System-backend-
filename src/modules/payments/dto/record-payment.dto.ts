import { IsInt, Min } from 'class-validator';

export class RecordPaymentDto {
  @IsInt()
  @Min(1)
  enrollmentId: number;

  @IsInt()
  @Min(1)
  amountPaid: number;
}
