import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'UNSPECIFIED' | null;
  birthDate?: string | null;
  attendanceCount?: number;
  lastCheckIn?: string | null;
  recentCheckIns?: string[];
  lastResponseAt?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/users/me`;

  getMyProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API_URL}/profile`);
  }

  updateMyProfile(payload: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.API_URL}/profile`, payload);
  }
}
