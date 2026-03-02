import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsInt()
  @Min(1)
  roomId: number;

  @IsInt()
  @Min(1)
  teacherId: number;

  @IsString()
  @IsNotEmpty()
  schedule: string;

  @IsInt()
  @Min(1)
  maxCapacity: number;
}
