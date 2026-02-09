import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashed = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashed,
        name: data.name,
        gender: data.gender,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        role: data.role ? (data.role as Role) : Role.STUDENT,
      },
    });

    // Remove password before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user as any;
    return rest;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findStudents() {
    const students = await this.prisma.user.findMany({
      where: { role: Role.STUDENT },
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        birthDate: true,
        isActive: true,
        workouts: {
          select: {
            id: true,
            title: true,
            description: true,
            dayOfWeek: true,
            exercises: {
              select: {
                id: true,
                name: true,
                sets: true,
                reps: true,
                weight: true,
                restTime: true,
                type: true,
              },
            },
          },
        },
        _count: { select: { workouts: true } },
      },
      orderBy: { name: 'asc' },
    });

    return students.map((student) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      gender: student.gender,
      birthDate: student.birthDate,
      isActive: student.isActive,
      workouts: student.workouts,
      workoutsCount: student._count.workouts,
    }));
  }

  async updateStudent(id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');

    if (dto.email && dto.email !== existing.email) {
      const emailExists = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (emailExists) throw new ConflictException('Email already registered');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        name: dto.name,
        gender: dto.gender,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        isActive: dto.isActive,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user as any;
    return rest;
  }

  async getStudentProfile(id: string) {
    const student = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { attendances: true } },
        attendances: {
          orderBy: { checkIn: 'desc' },
          take: 7,
          select: { checkIn: true },
        },
        notifications: {
          orderBy: [{ respondedAt: 'desc' }, { createdAt: 'desc' }],
          take: 1,
          select: { response: true, respondedAt: true, createdAt: true },
        },
      },
    });

    if (!student) throw new NotFoundException('User not found');

    const { password, ...rest } = student as any;
    return {
      ...rest,
      attendanceCount: student._count.attendances,
      lastCheckIn: student.attendances[0]?.checkIn ?? null,
      recentCheckIns: student.attendances.map((a) => a.checkIn),
      lastResponseAt:
        student.notifications[0]?.respondedAt ?? student.notifications[0]?.createdAt ?? null,
    };
  }

  async getMyProfile(userId: string) {
    return this.getStudentProfile(userId);
  }

  async updateMyProfile(userId: string, dto: UpdateProfileDto) {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) throw new NotFoundException('User not found');

    if (dto.email && dto.email !== existing.email) {
      const emailExists = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (emailExists) throw new ConflictException('Email already registered');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: dto.email,
        name: dto.name,
        gender: dto.gender,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      },
    });

    const { password, ...rest } = user as any;
    return rest;
  }

  async deactivateStudent(id: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user as any;
    return rest;
  }
}
