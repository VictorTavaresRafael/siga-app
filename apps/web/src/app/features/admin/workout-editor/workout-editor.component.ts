import { ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { WorkoutService } from '../../../core/services/workout.service';
import { AdminStudent } from '../../../core/services/admin-users.service';

@Component({
  selector: 'app-workout-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Gerenciar Treino</h2>
    <p class="feedback" *ngIf="statusMessage" [class.error]="statusType === 'error'">
      {{ statusMessage }}
    </p>
    <mat-dialog-content class="dialog-content">
    <form [formGroup]="form" (ngSubmit)="save()" class="dialog-form">
      <mat-form-field appearance="outline">
        <mat-label>Treino</mat-label>
        <mat-select formControlName="workoutId" (selectionChange)="onWorkoutChange($event.value)">
          <mat-option [value]="NEW_WORKOUT_ID">Novo treino</mat-option>
          <mat-option *ngFor="let workout of data.workouts" [value]="workout.id">
            {{ workout.title }}
          </mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Titulo</mat-label>
        <input matInput formControlName="title" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Descricao</mat-label>
        <textarea matInput rows="2" formControlName="description"></textarea>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Dia da semana</mat-label>
        <mat-select formControlName="dayOfWeek">
          <mat-option value="MON">Segunda</mat-option>
          <mat-option value="TUE">Terca</mat-option>
          <mat-option value="WED">Quarta</mat-option>
          <mat-option value="THU">Quinta</mat-option>
          <mat-option value="FRI">Sexta</mat-option>
          <mat-option value="SAT">Sabado</mat-option>
          <mat-option value="SUN">Domingo</mat-option>
        </mat-select>
      </mat-form-field>

      <div formArrayName="exercises" class="exercise-list">
        <div class="exercise" *ngFor="let ex of exercises.controls; let i = index" [formGroupName]="i">
          <mat-form-field appearance="outline">
            <mat-label>Exercicio</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Series</mat-label>
            <input matInput type="number" formControlName="sets" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Reps</mat-label>
            <input matInput formControlName="reps" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Carga (kg)</mat-label>
            <input matInput type="number" formControlName="weight" />
          </mat-form-field>
          <button mat-icon-button color="warn" type="button" class="delete-btn" (click)="removeExercise(i)">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      </div>

      <button mat-stroked-button color="primary" type="button" (click)="addExercise()">Adicionar exercicio</button>

      <div class="actions">
        <button mat-stroked-button color="primary" type="button" (click)="close()">Cancelar</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || isSaving">
          {{ isSaving ? 'Salvando...' : 'Salvar' }}
        </button>
      </div>
    </form>
    </mat-dialog-content>
  `,
  styles: [
    `
      .feedback { margin: 8px 0 0; padding: 10px 12px; border-radius: 10px; background: rgba(34, 197, 94, 0.14); color: #86efac; font-weight: 700; }
      .feedback.error { background: rgba(239, 68, 68, 0.14); color: #fca5a5; }
      .dialog-content { max-height: 70vh; overflow: auto; padding: 0; }
      .dialog-form { display: flex; flex-direction: column; gap: 18px; margin-top: 12px; }
      .exercise-list { display: grid; gap: 14px; }
      .exercise { display: grid; grid-template-columns: 2.2fr repeat(3, 1fr) auto; gap: 10px; align-items: center; padding: 12px; border-radius: 12px; background: linear-gradient(180deg, #161616, #111111); border: 1px solid #2f2f2f; }
      .delete-btn { align-self: center; }
      .actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 4px; }
      h2 { color: #fff; }
      @media (max-width: 900px) {
        .exercise { grid-template-columns: 1fr 1fr; }
      }
    `
  ]
})
export class WorkoutEditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private workoutService = inject(WorkoutService);
  private dialogRef = inject(MatDialogRef<WorkoutEditorComponent>);
  private cdr = inject(ChangeDetectorRef);
  readonly NEW_WORKOUT_ID = '__new__';
  isSaving = false;
  statusMessage = '';
  statusType: 'success' | 'error' | '' = '';

  form = this.fb.group({
    workoutId: ['', Validators.required],
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    dayOfWeek: [''],
    exercises: this.fb.array([]),
  });

  get exercises() {
    return this.form.get('exercises') as FormArray;
  }

  constructor(@Inject(MAT_DIALOG_DATA) public data: AdminStudent) {}

  ngOnInit(): void {
    if (this.data.workouts?.length) {
      this.form.patchValue({ workoutId: this.data.workouts[0].id });
      this.patchWorkout(this.data.workouts[0]);
    } else {
      this.startNewWorkout();
    }
  }

  onWorkoutChange(workoutId: string) {
    if (workoutId === this.NEW_WORKOUT_ID) {
      this.startNewWorkout();
      return;
    }

    const selected = this.data.workouts.find((w) => w.id === workoutId);
    if (selected) this.patchWorkout(selected);
  }

  patchWorkout(workout: any) {
    this.form.patchValue({
      title: workout.title,
      description: workout.description ?? '',
      dayOfWeek: workout.dayOfWeek ?? '',
    });

    this.exercises.clear();
    (workout.exercises ?? []).forEach((exercise: any) => {
      this.exercises.push(
        this.fb.group({
          name: [exercise.name, [Validators.required, Validators.minLength(2)]],
          sets: [exercise.sets, [Validators.required, Validators.min(1)]],
          reps: [exercise.reps, [Validators.required]],
          weight: [exercise.weight ?? null],
        })
      );
    });
  }

  startNewWorkout() {
    this.form.patchValue({
      workoutId: this.NEW_WORKOUT_ID,
      title: '',
      description: '',
      dayOfWeek: '',
    });
    this.exercises.clear();
  }

  addExercise() {
    this.exercises.push(
      this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        sets: [3, [Validators.required, Validators.min(1)]],
        reps: ['10-12', [Validators.required]],
        weight: [null],
      })
    );
  }

  removeExercise(index: number) {
    this.exercises.removeAt(index);
  }

  save() {
    if (this.form.invalid) return;
    const { workoutId, ...payload } = this.form.value as any;
    this.isSaving = true;
    this.statusMessage = '';
    this.statusType = '';

    if (workoutId === this.NEW_WORKOUT_ID) {
      this.workoutService.createWorkout({ ...payload, userId: this.data.id }).subscribe(() => {
        this.finishSave('Treino criado com sucesso.', 'success');
        setTimeout(() => this.dialogRef.close(true), 1200);
      }, () => {
        this.finishSave('Nao foi possivel criar o treino.', 'error');
      });
      return;
    }

    this.workoutService.updateWorkout(workoutId, payload).subscribe(() => {
      this.dialogRef.close(true);
    }, () => {
      this.finishSave('Nao foi possivel salvar o treino.', 'error');
    });
  }

  private finishSave(message: string, type: 'success' | 'error') {
    queueMicrotask(() => {
      this.isSaving = false;
      this.statusMessage = message;
      this.statusType = type;
      this.cdr.markForCheck();
    });
  }

  close() {
    this.dialogRef.close(false);
  }
}


