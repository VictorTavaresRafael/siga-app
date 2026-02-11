import { BadRequestException, Controller, Get, Header, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExerciseHelpService } from './exercise-help.service';

@Controller('exercise-help')
@UseGuards(JwtAuthGuard)
export class ExerciseHelpController {
  constructor(private readonly exerciseHelpService: ExerciseHelpService) {}

  @Get()
  @Header('Cache-Control', 'no-store, max-age=0')
  @Header('Pragma', 'no-cache')
  async getExerciseHelp(@Query('name') name?: string) {
    const trimmedName = (name ?? '').trim();
    if (!trimmedName) {
      throw new BadRequestException('O parametro "name" e obrigatorio.');
    }
    return this.exerciseHelpService.findByName(trimmedName);
  }
}
