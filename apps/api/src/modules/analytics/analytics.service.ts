import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Gender, Role } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async exportAttendanceCsv() {
    const rows = await this.prisma.attendance.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { checkIn: 'desc' },
    });

    const header = 'date,userId,userName,userEmail';
    const lines = rows.map((row) => {
      const date = row.checkIn.toISOString();
      const userId = row.user?.id ?? '';
      const userName = row.user?.name ?? '';
      const userEmail = row.user?.email ?? '';
      return `${date},${userId},"${userName}",${userEmail}`;
    });

    return [header, ...lines].join('\n');
  }

  async exportFrequencyCsv(start: Date, end: Date) {
    const data = await this.getFrequencyRange(start, end);
    const header = 'day,count';
    const lines = data.map((row) => `${row.day},${row.count}`);
    return [header, ...lines].join('\n');
  }

  async exportFrequencyByGenderCsv(start: Date, end: Date) {
    const rows = await this.getFrequencyByGender(start, end);
    const header = 'day,gender,count';
    const lines = rows.map((row) => `${row.day},${row.gender},${row.count}`);
    return [header, ...lines].join('\n');
  }

  async exportFrequencyByAgeCsv(start: Date, end: Date) {
    const rows = await this.getFrequencyByAge(start, end);
    const header = 'day,ageRange,count';
    const lines = rows.map((row) => `${row.day},${row.ageRange},${row.count}`);
    return [header, ...lines].join('\n');
  }

  async exportSummaryGenderCsv(start: Date, end: Date) {
    const rows = await this.getSummaryByGender(start, end);
    const header = 'gender,count';
    const lines = rows.map((row) => `${row.gender},${row.count}`);
    return [header, ...lines].join('\n');
  }

  async exportSummaryAgeCsv(start: Date, end: Date) {
    const rows = await this.getSummaryByAgeRange(start, end);
    const header = 'ageRange,count';
    const lines = rows.map((row) => `${row.ageRange},${row.count}`);
    return [header, ...lines].join('\n');
  }

  async exportGenderAgeMatrixCsv(start: Date, end: Date) {
    const rows = await this.getGenderByAgeRange(start, end);
    const header = 'gender,ageRange,count';
    const lines = rows.map((row) => `${row.gender},${row.ageRange},${row.count}`);
    return [header, ...lines].join('\n');
  }

  async exportHourlyPeakCsv(start: Date, end: Date) {
    const rows = await this.getHourlyPeak(start, end);
    const header = 'hour,count';
    const lines = rows.map((row) => `${row.hour},${row.count}`);
    return [header, ...lines].join('\n');
  }

  async getFrequency(days = 7) {
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

  async getFrequencyRange(startDate: Date, endDate: Date) {
    const rows = await this.prisma.$queryRaw<
      { day: Date; count: number }[]
    >`SELECT DATE("checkIn") as day, COUNT(*)::int as count
      FROM attendances
      WHERE "checkIn" >= ${startDate} AND "checkIn" <= ${endDate}
      GROUP BY day
      ORDER BY day ASC`;

    const counts = new Map<string, number>();
    rows.forEach((row) => {
      const dayKey = row.day.toISOString().slice(0, 10);
      counts.set(dayKey, row.count);
    });

    const output: { day: string; count: number }[] = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    const last = new Date(endDate);
    last.setHours(0, 0, 0, 0);
    while (current <= last) {
      const dayKey = current.toISOString().slice(0, 10);
      output.push({ day: dayKey, count: counts.get(dayKey) ?? 0 });
      current.setDate(current.getDate() + 1);
    }

    return output;
  }

  async getSummary() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const [studentsActive, checkInsToday, pendingQuestions] = await Promise.all([
      this.prisma.user.count({
        where: { role: Role.STUDENT, isActive: true },
      }),
      this.prisma.attendance.count({
        where: { checkIn: { gte: start } },
      }),
      this.prisma.notification.count({
        where: { response: null },
      }),
    ]);

    return { studentsActive, checkInsToday, pendingQuestions };
  }

  async getGenderStats() {
    const rows = await this.prisma.user.groupBy({
      by: ['gender'],
      where: { role: Role.STUDENT },
      _count: { _all: true },
    });

    const labels = ['Masculino', 'Feminino', 'Outro', 'Prefiro nao dizer'];
    const mapping: Record<Gender, number> = {
      MALE: 0,
      FEMALE: 1,
      OTHER: 2,
      UNSPECIFIED: 3,
    };

    const data = [0, 0, 0, 0];
    rows.forEach((row) => {
      const index = mapping[row.gender ?? Gender.UNSPECIFIED];
      data[index] = row._count._all;
    });

    return { labels, data };
  }

  async getAgeRangeStats() {
    const students = await this.prisma.user.findMany({
      where: { role: Role.STUDENT },
      select: { birthDate: true },
    });

    const ranges = [
      { label: '0-17', min: 0, max: 17 },
      { label: '18-25', min: 18, max: 25 },
      { label: '26-35', min: 26, max: 35 },
      { label: '36-45', min: 36, max: 45 },
      { label: '46-60', min: 46, max: 60 },
      { label: '60+', min: 61, max: 200 },
      { label: 'Nao informado', min: -1, max: -1 },
    ];

    const counts = new Map<string, number>();
    ranges.forEach((r) => counts.set(r.label, 0));

    const today = new Date();
    students.forEach((student) => {
      if (!student.birthDate) {
        counts.set('Nao informado', (counts.get('Nao informado') ?? 0) + 1);
        return;
      }
      const age = this.calculateAge(student.birthDate, today);
      const range = ranges.find((r) => r.min <= age && age <= r.max);
      const label = range?.label ?? 'Nao informado';
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });

    const labels = ranges.map((r) => r.label);
    const data = labels.map((label) => counts.get(label) ?? 0);
    return { labels, data };
  }

  async getFrequencyByGender(start: Date, end: Date) {
    const rows = await this.prisma.$queryRaw<
      { day: Date; gender: Gender | null; count: number }[]
    >`SELECT DATE(a."checkIn") as day, u.gender, COUNT(*)::int as count
      FROM attendances a
      JOIN users u ON u.id = a."userId"
      WHERE a."checkIn" >= ${start} AND a."checkIn" <= ${end}
      GROUP BY day, u.gender
      ORDER BY day ASC`;

    const genders = ['Masculino', 'Feminino', 'Outro', 'Prefiro nao dizer'];
    const mapGender = (value: Gender | null) => {
      switch (value ?? Gender.UNSPECIFIED) {
        case Gender.MALE:
          return 'Masculino';
        case Gender.FEMALE:
          return 'Feminino';
        case Gender.OTHER:
          return 'Outro';
        default:
          return 'Prefiro nao dizer';
      }
    };

    const counts = new Map<string, number>();
    rows.forEach((row) => {
      const dayKey = row.day.toISOString().slice(0, 10);
      const gender = mapGender(row.gender);
      counts.set(`${dayKey}|${gender}`, row.count);
    });

    const output: { day: string; gender: string; count: number }[] = [];
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);
    const last = new Date(end);
    last.setHours(0, 0, 0, 0);
    while (current <= last) {
      const dayKey = current.toISOString().slice(0, 10);
      genders.forEach((gender) => {
        output.push({
          day: dayKey,
          gender,
          count: counts.get(`${dayKey}|${gender}`) ?? 0,
        });
      });
      current.setDate(current.getDate() + 1);
    }

    return output;
  }

  async getFrequencyByAge(start: Date, end: Date) {
    const rows = await this.prisma.$queryRaw<
      { day: Date; birthDate: Date | null; count: number }[]
    >`SELECT DATE(a."checkIn") as day, u."birthDate" as "birthDate", COUNT(*)::int as count
      FROM attendances a
      JOIN users u ON u.id = a."userId"
      WHERE a."checkIn" >= ${start} AND a."checkIn" <= ${end}
      GROUP BY day, u."birthDate"
      ORDER BY day ASC`;

    const ranges = this.getAgeRanges();
    const counts = new Map<string, number>();
    const today = new Date();
    rows.forEach((row) => {
      const dayKey = row.day.toISOString().slice(0, 10);
      const range = this.getRangeLabel(row.birthDate, row.day, ranges);
      counts.set(`${dayKey}|${range}`, (counts.get(`${dayKey}|${range}`) ?? 0) + row.count);
    });

    const output: { day: string; ageRange: string; count: number }[] = [];
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);
    const last = new Date(end);
    last.setHours(0, 0, 0, 0);
    while (current <= last) {
      const dayKey = current.toISOString().slice(0, 10);
      ranges.forEach((range) => {
        output.push({
          day: dayKey,
          ageRange: range.label,
          count: counts.get(`${dayKey}|${range.label}`) ?? 0,
        });
      });
      current.setDate(current.getDate() + 1);
    }

    return output;
  }

  async getSummaryByGender(start: Date, end: Date) {
    const rows = await this.prisma.$queryRaw<
      { gender: Gender | null; count: number }[]
    >`SELECT u.gender, COUNT(*)::int as count
      FROM attendances a
      JOIN users u ON u.id = a."userId"
      WHERE a."checkIn" >= ${start} AND a."checkIn" <= ${end}
      GROUP BY u.gender`;

    const output = [
      { gender: 'Masculino', count: 0 },
      { gender: 'Feminino', count: 0 },
      { gender: 'Outro', count: 0 },
      { gender: 'Prefiro nao dizer', count: 0 },
    ];

    rows.forEach((row) => {
      const gender = row.gender ?? Gender.UNSPECIFIED;
      const index =
        gender === Gender.MALE ? 0 : gender === Gender.FEMALE ? 1 : gender === Gender.OTHER ? 2 : 3;
      output[index].count = row.count;
    });

    return output;
  }

  async getSummaryByAgeRange(start: Date, end: Date) {
    const rows = await this.prisma.$queryRaw<
      { birthDate: Date | null; count: number }[]
    >`SELECT u."birthDate" as "birthDate", COUNT(*)::int as count
      FROM attendances a
      JOIN users u ON u.id = a."userId"
      WHERE a."checkIn" >= ${start} AND a."checkIn" <= ${end}
      GROUP BY u."birthDate"`;

    const ranges = this.getAgeRanges();
    const counts = new Map<string, number>();
    rows.forEach((row) => {
      const range = this.getRangeLabel(row.birthDate, end, ranges);
      counts.set(range, (counts.get(range) ?? 0) + row.count);
    });

    return ranges.map((range) => ({
      ageRange: range.label,
      count: counts.get(range.label) ?? 0,
    }));
  }

  async getGenderByAgeRange(start: Date, end: Date) {
    const rows = await this.prisma.$queryRaw<
      { gender: Gender | null; birthDate: Date | null; count: number }[]
    >`SELECT u.gender, u."birthDate" as "birthDate", COUNT(*)::int as count
      FROM attendances a
      JOIN users u ON u.id = a."userId"
      WHERE a."checkIn" >= ${start} AND a."checkIn" <= ${end}
      GROUP BY u.gender, u."birthDate"`;

    const genders = ['Masculino', 'Feminino', 'Outro', 'Prefiro nao dizer'];
    const ranges = this.getAgeRanges();
    const counts = new Map<string, number>();
    rows.forEach((row) => {
      const gender = row.gender ?? Gender.UNSPECIFIED;
      const genderLabel =
        gender === Gender.MALE ? 'Masculino' : gender === Gender.FEMALE ? 'Feminino' : gender === Gender.OTHER ? 'Outro' : 'Prefiro nao dizer';
      const range = this.getRangeLabel(row.birthDate, end, ranges);
      counts.set(`${genderLabel}|${range}`, (counts.get(`${genderLabel}|${range}`) ?? 0) + row.count);
    });

    const output: { gender: string; ageRange: string; count: number }[] = [];
    genders.forEach((gender) => {
      ranges.forEach((range) => {
        output.push({
          gender,
          ageRange: range.label,
          count: counts.get(`${gender}|${range.label}`) ?? 0,
        });
      });
    });
    return output;
  }

  async getHourlyPeak(start: Date, end: Date) {
    const rows = await this.prisma.$queryRaw<
      { hour: number; count: number }[]
    >`SELECT EXTRACT(HOUR FROM a."checkIn")::int as hour, COUNT(*)::int as count
      FROM attendances a
      WHERE a."checkIn" >= ${start} AND a."checkIn" <= ${end}
      GROUP BY hour
      ORDER BY hour ASC`;

    const counts = new Map<number, number>();
    rows.forEach((row) => counts.set(row.hour, row.count));
    const output: { hour: number; count: number }[] = [];
    for (let h = 0; h <= 23; h += 1) {
      output.push({ hour: h, count: counts.get(h) ?? 0 });
    }
    return output;
  }

  private calculateAge(birthDate: Date, today: Date) {
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }
    return age;
  }

  private getAgeRanges() {
    return [
      { label: '0-17', min: 0, max: 17 },
      { label: '18-25', min: 18, max: 25 },
      { label: '26-35', min: 26, max: 35 },
      { label: '36-45', min: 36, max: 45 },
      { label: '46-60', min: 46, max: 60 },
      { label: '60+', min: 61, max: 200 },
      { label: 'Nao informado', min: -1, max: -1 },
    ];
  }

  private getRangeLabel(birthDate: Date | null, refDate: Date, ranges: { label: string; min: number; max: number }[]) {
    if (!birthDate) return 'Nao informado';
    const age = this.calculateAge(birthDate, refDate);
    const range = ranges.find((r) => r.min <= age && age <= r.max);
    return range?.label ?? 'Nao informado';
  }
}
