import { IsBoolean, IsOptional, IsInt, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';

export class ConfirmPaymentDto {
  @IsBoolean()
  paymentConfirmed: boolean;

  @IsOptional()
  @Transform(({ value }: { value: string | number }) =>
    parseInt(String(value), 10),
  )
  @IsInt()
  @IsPositive()
  subscriptionDays?: number = 30;
}
