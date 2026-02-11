import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
@Roles(Role.ADMIN)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('export')
  async exportAttendance(
    @Res({ passthrough: true }) res: Response,
    @Query('type')
    type?:
      | 'freq_daily'
      | 'freq_gender'
      | 'freq_age'
      | 'summary_gender'
      | 'summary_age'
      | 'gender_age'
      | 'hourly_peak'
      | 'attendance',
    @Query('days') days?: string,
    @Query('start') start?: string,
    @Query('end') end?: string
  ) {
    const parsed = days ? Number(days) : 7;
    const safeDays = Number.isFinite(parsed) ? Math.max(1, Math.min(parsed, 365)) : 7;
    const range = this.parseRange(safeDays, start, end);

    let csv = '';
    let filename = '';
    const today = new Date().toISOString().slice(0, 10);

    switch (type) {
      case 'attendance':
        csv = await this.analyticsService.exportAttendanceCsv();
        filename = `attendance-${today}.csv`;
        break;
      case 'freq_gender':
        csv = await this.analyticsService.exportFrequencyByGenderCsv(range.start, range.end);
        filename = `freq-gender-${range.label}-${today}.csv`;
        break;
      case 'freq_age':
        csv = await this.analyticsService.exportFrequencyByAgeCsv(range.start, range.end);
        filename = `freq-age-${range.label}-${today}.csv`;
        break;
      case 'summary_gender':
        csv = await this.analyticsService.exportSummaryGenderCsv(range.start, range.end);
        filename = `summary-gender-${range.label}-${today}.csv`;
        break;
      case 'summary_age':
        csv = await this.analyticsService.exportSummaryAgeCsv(range.start, range.end);
        filename = `summary-age-${range.label}-${today}.csv`;
        break;
      case 'gender_age':
        csv = await this.analyticsService.exportGenderAgeMatrixCsv(range.start, range.end);
        filename = `gender-age-${range.label}-${today}.csv`;
        break;
      case 'hourly_peak':
        csv = await this.analyticsService.exportHourlyPeakCsv(range.start, range.end);
        filename = `hourly-peak-${range.label}-${today}.csv`;
        break;
      case 'freq_daily':
      default:
        csv = await this.analyticsService.exportFrequencyCsv(range.start, range.end);
        filename = `freq-daily-${range.label}-${today}.csv`;
        break;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return csv;
  }

  private parseRange(days: number, start?: string, end?: string) {
    if (start && end) {
      const startDate = new Date(`${start}T00:00:00.000Z`);
      const endDate = new Date(`${end}T23:59:59.999Z`);
      return { start: startDate, end: endDate, label: `${start}_${end}` };
    }

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (days - 1));
    return { start: startDate, end: endDate, label: `${days}d` };
  }

  @Get('frequency')
  async getFrequency(@Query('days') days?: string) {
    const parsed = days ? Number(days) : 7;
    const safeDays = Number.isFinite(parsed) ? Math.max(1, Math.min(parsed, 30)) : 7;
    return this.analyticsService.getFrequency(safeDays);
  }

  @Get('summary')
  async getSummary() {
    return this.analyticsService.getSummary();
  }

  @Get('demographics')
  async getDemographics(@Query('type') type: 'gender' | 'ageRange') {
    if (type === 'ageRange') {
      return this.analyticsService.getAgeRangeStats();
    }
    return this.analyticsService.getGenderStats();
  }

  @Get('series')
  async getSeries(
    @Query('type')
    type:
      | 'freq_daily'
      | 'freq_gender'
      | 'freq_age'
      | 'summary_gender'
      | 'summary_age'
      | 'gender_age'
      | 'hourly_peak',
    @Query('days') days?: string,
    @Query('start') start?: string,
    @Query('end') end?: string
  ) {
    const parsed = days ? Number(days) : 7;
    const safeDays = Number.isFinite(parsed) ? Math.max(1, Math.min(parsed, 365)) : 7;
    const range = this.parseRange(safeDays, start, end);

    switch (type) {
      case 'freq_gender':
        return this.analyticsService.getFrequencyByGender(range.start, range.end);
      case 'freq_age':
        return this.analyticsService.getFrequencyByAge(range.start, range.end);
      case 'summary_gender':
        return this.analyticsService.getSummaryByGender(range.start, range.end);
      case 'summary_age':
        return this.analyticsService.getSummaryByAgeRange(range.start, range.end);
      case 'gender_age':
        return this.analyticsService.getGenderByAgeRange(range.start, range.end);
      case 'hourly_peak':
        return this.analyticsService.getHourlyPeak(range.start, range.end);
      case 'freq_daily':
      default:
        return this.analyticsService.getFrequencyRange(range.start, range.end);
    }
  }
}
