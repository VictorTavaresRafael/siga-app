import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { WorkoutsService } from './workouts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { UpdateWorkoutDto } from './dto/update-workout.dto';
import { CreateWorkoutDto } from './dto/create-workout.dto';

@Controller('workouts')
@UseGuards(JwtAuthGuard)
export class WorkoutsController {
  constructor(private workoutsService: WorkoutsService) {}

  @Get('my-workouts')
  @Roles(Role.STUDENT)
  async getMyWorkouts(@Req() req: Request) {
    const user = req.user as any;
    return this.workoutsService.getMyWorkouts(user.id);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  async updateWorkout(@Param('id') id: string, @Body() dto: UpdateWorkoutDto) {
    return this.workoutsService.updateWorkout(id, dto);
  }

  @Post()
  @Roles(Role.ADMIN)
  async createWorkout(@Body() dto: CreateWorkoutDto) {
    return this.workoutsService.createWorkout(dto);
  }
}
