import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface ExerciseHelpData {
  id: string | null;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
  instructions: string[];
  secondaryMuscles: string[];
  gifUrl: string | null;
}

export interface ExerciseHelpResponse {
  found: boolean;
  data: ExerciseHelpData | null;
  suggestions: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ExerciseHelpService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/exercise-help`;

  getByName(name: string) {
    const params = new HttpParams().set('name', name);
    return this.http.get<ExerciseHelpResponse>(this.apiUrl, { params });
  }
}
