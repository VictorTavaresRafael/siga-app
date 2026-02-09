import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Gender } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongP@ssw0rd' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Fulano de Tal' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ required: false, enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({ required: false, example: '2000-01-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  // role is optional; default to STUDENT in persistence layer
  @ApiProperty({ required: false })
  role?: string;
}
