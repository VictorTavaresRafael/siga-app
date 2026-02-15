import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const token = localStorage.getItem('token');
  if (!token || isTokenExpired(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    return router.parseUrl('/login');
  }

  const role = localStorage.getItem('role') ?? authService.getRoleFromToken(token);
  if (role === 'ADMIN') return true;

  return router.parseUrl('/dashboard');
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
