import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Workout } from '../../models/workout.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/workouts`;

  // Retorna um Observable de uma lista de treinos
  getMyWorkouts(): Observable<Workout[]> {
    return this.http.get<Workout[]>(`${this.API_URL}/my-workouts`).pipe(
      // Exemplo de operador RxJS pedido pelo Luiz
      map(workouts => workouts.filter(w => w.exercises.length > 0))
    );
  }

  updateWorkout(id: string, payload: Partial<Workout>): Observable<Workout> {
    return this.http.put<Workout>(`${this.API_URL}/${id}`, payload);
  }

  createWorkout(payload: Partial<Workout> & { userId: string }): Observable<Workout> {
    return this.http.post<Workout>(`${this.API_URL}`, payload);
  }
}
