import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  const expired = isTokenExpired(token);

  if (expired) {
    clearSession();
    void router.navigate(['/login']);
    return next(req);
  }

  const request = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(request).pipe(
    catchError((error) => {
      if (error?.status === 401) {
        clearSession();
        void router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};

function clearSession(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
}

function isTokenExpired(token: string | null): boolean {
  if (!token) return false;

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
