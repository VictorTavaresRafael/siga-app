import { Module } from '@nestjs/common';
import { ExerciseHelpController } from './exercise-help.controller';
import { ExerciseHelpService } from './exercise-help.service';

@Module({
  controllers: [ExerciseHelpController],
  providers: [ExerciseHelpService],
})
export class ExerciseHelpModule {}
