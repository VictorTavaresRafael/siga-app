import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token && !isTokenExpired(token)) {
    return true;
  }

  localStorage.removeItem('token');
  localStorage.removeItem('role');
  return router.parseUrl('/login');
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
