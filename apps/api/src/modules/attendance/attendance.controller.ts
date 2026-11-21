import { BadRequestException, Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { getJwtSecret } from '../auth/jwt-secret';
import { buildDailyCode, isValidDailyCode, localDay } from './daily-code';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('check-in')
  @Roles(Role.STUDENT)
  async checkIn(@Req() req: Request, @Body() body: { qrCode?: string }) {
    const user = req.user as any;

    if (!isValidDailyCode(body?.qrCode, this.checkInSecret())) {
      throw new BadRequestException('QR Code inválido');
    }

    return this.attendanceService.registerCheckIn(user.id);
  }

  @Get('daily-code')
  @Roles(Role.ADMIN)
  getDailyCode() {
    return { day: localDay(), code: buildDailyCode(this.checkInSecret()) };
  }

  @Get('me/today')
  @Roles(Role.STUDENT)
  async hasCheckInToday(@Req() req: Request) {
    const user = req.user as any;
    const checkedIn = await this.attendanceService.hasCheckInToday(user.id);
    return { checkedIn };
  }

  @Get('analytics/frequency')
  @Roles(Role.ADMIN)
  async getFrequency(@Query('days') days?: string) {
    const parsed = days ? Number(days) : 7;
    const safeDays = Number.isFinite(parsed) ? Math.max(1, Math.min(parsed, 30)) : 7;
    return this.attendanceService.getFrequency(safeDays);
  }

  private checkInSecret() {
    return process.env.CHECKIN_SECRET?.trim() || getJwtSecret();
  }
}
