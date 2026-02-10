import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateWorkoutDto } from './dto/update-workout.dto';
import { CreateWorkoutDto } from './dto/create-workout.dto';

@Injectable()
export class WorkoutsService {
  constructor(private prisma: PrismaService) {}

  async getMyWorkouts(userId: string) {
    return this.prisma.workout.findMany({
      where: { userId },
      include: { exercises: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateWorkout(id: string, dto: UpdateWorkoutDto) {
    const workout = await this.prisma.workout.findUnique({ where: { id } });
    if (!workout) throw new NotFoundException('Workout not found');

    const data: any = {
      title: dto.title,
      description: dto.description,
      dayOfWeek: dto.dayOfWeek,
    };

    if (dto.exercises) {
      data.exercises = {
        deleteMany: {},
        create: dto.exercises.map((exercise) => ({
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
          restTime: exercise.restTime,
          type: exercise.type,
        })),
      };
    }

    return this.prisma.workout.update({
      where: { id },
      data,
      include: { exercises: true },
    });
  }

  async createWorkout(dto: CreateWorkoutDto) {
    const data: any = {
      title: dto.title,
      description: dto.description,
      dayOfWeek: dto.dayOfWeek,
      userId: dto.userId,
    };

    if (dto.exercises?.length) {
      data.exercises = {
        create: dto.exercises.map((exercise) => ({
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
          restTime: exercise.restTime,
          type: exercise.type,
        })),
      };
    }

    return this.prisma.workout.create({
      data,
      include: { exercises: true },
    });
  }
}
