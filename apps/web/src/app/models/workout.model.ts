export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: number;
}

export interface Workout {
  id: string;
  title: string;
  description?: string;
  dayOfWeek?: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  exercises: Exercise[];
}
