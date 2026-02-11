import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @MinLength(3)
  type!: string;

  @IsString()
  @MinLength(5)
  content!: string;

  @IsOptional()
  @IsString()
  category?: string;
}
