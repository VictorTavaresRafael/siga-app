import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

type LoginCredentials = {
  email: string;
  password: string;
};

type LoginApiResponse = {
  access_token?: string;
  token?: string;
  [key: string]: unknown;
};

type LoginResult = LoginApiResponse & {
  access_token?: string;
  role?: string | null;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/auth`;

  login(credentials: LoginCredentials): Observable<LoginResult> {
    return this.http.post<LoginApiResponse>(`${this.API_URL}/login`, credentials).pipe(
      map((res) => {
        const token = res?.access_token ?? res?.token;
        if (!token) {
          return res;
        }

        const role = this.getRoleFromToken(token);
        localStorage.setItem('token', token);
        if (role) {
          localStorage.setItem('role', role);
        }

        return { ...res, access_token: token, role };
      })
    );
  }

  getRoleFromToken(token?: string | null): string | null {
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const decoded = JSON.parse(this.base64UrlDecode(payload));
      return typeof decoded?.role === 'string' ? decoded.role : null;
    } catch {
      return null;
    }
  }

  private base64UrlDecode(value: string): string {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
    return atob(padded);
  }

  getRole(): string | null {
    const token = localStorage.getItem('token');
    return localStorage.getItem('role') ?? this.getRoleFromToken(token);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  }
}
