import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateClassDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  roomId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  teacherId?: number;

  @IsOptional()
  @IsString()
  schedule?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxCapacity?: number;
}
