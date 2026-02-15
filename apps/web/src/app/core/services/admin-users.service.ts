import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminStudent {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  workoutsCount: number;
  workouts: any[];
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'UNSPECIFIED' | null;
  birthDate?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AdminUsersService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/users`;

  getStudents(): Observable<AdminStudent[]> {
    return this.http.get<AdminStudent[]>(`${this.API_URL}/students`);
  }

  createStudent(payload: { name: string; email: string; password: string }): Observable<any> {
    return this.http.post(this.API_URL, payload);
  }

  updateStudent(id: string, payload: Partial<AdminStudent>): Observable<any> {
    return this.http.patch(`${this.API_URL}/${id}`, payload);
  }

  getStudentProfile(id: string): Observable<any> {
    return this.http.get(`${this.API_URL}/students/${id}/profile`);
  }

  deactivateStudent(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }
}
