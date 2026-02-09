import { IsBoolean, IsDateString, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Gender } from '@prisma/client';

export class UpdateUserDto {
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

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
