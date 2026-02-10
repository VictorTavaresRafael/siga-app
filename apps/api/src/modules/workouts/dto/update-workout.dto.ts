import { IsArray, IsEnum, IsInt, IsOptional, IsString, Min, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek, ExerciseType } from '@prisma/client';

export class ExerciseInputDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsInt()
  @Min(1)
  sets!: number;

  @IsString()
  reps!: string;

  @IsOptional()
  weight?: number;

  @IsOptional()
  restTime?: number;

  @IsOptional()
  @IsEnum(ExerciseType)
  type?: ExerciseType;
}

export class UpdateWorkoutDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(DayOfWeek)
  dayOfWeek?: DayOfWeek;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseInputDto)
  exercises?: ExerciseInputDto[];
}
