import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AttendanceService } from '../services/attendance.service';
import { AuthService } from '../services/auth.service';

export const presenceGuard: CanActivateFn = () => {
  const router = inject(Router);
  const attendanceService = inject(AttendanceService);
  const authService = inject(AuthService);

  const token = localStorage.getItem('token');
  if (!token || isTokenExpired(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    return router.parseUrl('/login');
  }

  const role = localStorage.getItem('role') ?? authService.getRoleFromToken(token);
  if (role === 'ADMIN') return router.parseUrl('/admin');
  if (role !== 'STUDENT') return true;

  return attendanceService.hasCheckInToday().pipe(
    map((res) => (res.checkedIn ? true : router.parseUrl('/check-in'))),
    catchError((error) => {
      if (error?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        return of(router.parseUrl('/login'));
      }
      return of(router.parseUrl('/check-in'));
    })
  );
};

function isTokenExpired(token: string): boolean {
  const payload = token.split('.')[1];
  if (!payload) return true;

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = JSON.parse(atob(padded));
    const exp = Number(decoded?.exp);
    if (!Number.isFinite(exp)) return true;

    const now = Math.floor(Date.now() / 1000);
    return exp <= now;
  } catch {
    return true;
  }
}
