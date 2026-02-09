import { IsDateString, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Gender } from '@prisma/client';

export class UpdateProfileDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsDateString()
  birthDate?: string;
}
