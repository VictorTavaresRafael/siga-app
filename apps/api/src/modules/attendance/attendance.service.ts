import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async registerCheckIn(userId: string) {
    const start = this.startOfToday();
    const existing = await this.prisma.attendance.findFirst({
      where: {
        userId,
        checkIn: { gte: start },
      },
    });

    if (existing) {
      return { alreadyCheckedIn: true, attendanceId: existing.id };
    }

    const attendance = await this.prisma.attendance.create({
      data: { userId },
    });

    return { alreadyCheckedIn: false, attendanceId: attendance.id };
  }

  async hasCheckInToday(userId: string) {
    const start = this.startOfToday();
    const attendance = await this.prisma.attendance.findFirst({
      where: { userId, checkIn: { gte: start } },
    });
    return !!attendance;
  }

  async getFrequency(days: number) {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (days - 1));

    const rows = await this.prisma.$queryRaw<
      { day: Date; count: number }[]
    >`SELECT DATE("checkIn") as day, COUNT(*)::int as count
      FROM attendances
      WHERE "checkIn" >= ${startDate}
      GROUP BY day
      ORDER BY day ASC`;

    const counts = new Map<string, number>();
    rows.forEach((row) => {
      const dayKey = row.day.toISOString().slice(0, 10);
      counts.set(dayKey, row.count);
    });

    const output: { day: string; count: number }[] = [];
    for (let i = 0; i < days; i += 1) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      const dayKey = current.toISOString().slice(0, 10);
      output.push({ day: dayKey, count: counts.get(dayKey) ?? 0 });
    }

    return output;
  }

  private startOfToday() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start;
  }
}
