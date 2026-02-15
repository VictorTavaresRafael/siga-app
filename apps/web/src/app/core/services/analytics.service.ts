import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

type AnalyticsSeriesType =
  | 'freq_daily'
  | 'freq_gender'
  | 'freq_age'
  | 'summary_gender'
  | 'summary_age'
  | 'gender_age'
  | 'hourly_peak';

type AnalyticsExportType = AnalyticsSeriesType | 'attendance';

type AnalyticsSeriesPoint = Record<string, string | number | null>;

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/analytics`;

  getFrequency(): Observable<{ day: string; count: number }[]> {
    return this.http.get<{ day: string; count: number }[]>(
      `${environment.apiUrl}/attendance/analytics/frequency`
    );
  }

  getFrequencyByDays(days: number): Observable<{ day: string; count: number }[]> {
    return this.http.get<{ day: string; count: number }[]>(
      `${environment.apiUrl}/attendance/analytics/frequency?days=${days}`
    );
  }

  getDemographics(type: 'gender' | 'ageRange'): Observable<{ labels: string[]; data: number[] }> {
    return this.http.get<{ labels: string[]; data: number[] }>(
      `${this.API_URL}/demographics?type=${type}`
    );
  }

  getSummary(): Observable<{ studentsActive: number; checkInsToday: number; pendingQuestions: number }> {
    return this.http.get<{ studentsActive: number; checkInsToday: number; pendingQuestions: number }>(
      `${this.API_URL}/summary`
    );
  }

  exportCsv(
    type: AnalyticsExportType,
    params: { days?: number; start?: string; end?: string }
  ): Observable<Blob> {
    const query = new URLSearchParams();
    query.set('type', type);
    if (params.days) query.set('days', String(params.days));
    if (params.start && params.end) {
      query.set('start', params.start);
      query.set('end', params.end);
    }
    return this.http.get(`${this.API_URL}/export?${query.toString()}`, { responseType: 'blob' });
  }

  getSeries(
    type: AnalyticsSeriesType,
    params: { days?: number; start?: string; end?: string }
  ): Observable<AnalyticsSeriesPoint[]> {
    const query = new URLSearchParams();
    query.set('type', type);
    if (params.days) query.set('days', String(params.days));
    if (params.start && params.end) {
      query.set('start', params.start);
      query.set('end', params.end);
    }
    return this.http.get<AnalyticsSeriesPoint[]>(`${this.API_URL}/series?${query.toString()}`);
  }
}
