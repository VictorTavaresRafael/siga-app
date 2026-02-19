import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkoutService } from '../../../core/services/workout.service';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { finalize } from 'rxjs/operators';
import { NotificationsService } from '../../../core/services/notifications.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { MatIconModule } from '@angular/material/icon';
import { ExerciseHelpData, ExerciseHelpService } from '../../../core/services/exercise-help.service';

const DAYS = [
  { code: 'MON', label: 'Segunda' },
  { code: 'TUE', label: 'Terca' },
  { code: 'WED', label: 'Quarta' },
  { code: 'THU', label: 'Quinta' },
  { code: 'FRI', label: 'Sexta' },
  { code: 'SAT', label: 'Sabado' },
];

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatListModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatTabsModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    MatIconModule,
  ],
  template: `
    <div class="dashboard-shell">
      <header class="hero">
        <div>
          <h1>Meu Painel</h1>
          <p class="subtitle">Acompanhe treinos, perfil e respostas.</p>
        </div>
      </header>

      <mat-card class="tabs-card">
        <mat-tab-group>
          <mat-tab label="Treinos">
            <div class="panel-grid">
              <mat-card class="panel">
                <mat-card-header>
                  <mat-card-title>Treinos da Semana</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="day-grid" *ngIf="workoutsByDay$ | async as days; else loading">
                    <mat-card class="day-card" *ngFor="let day of days" [class.today]="day.code === currentDay" [class.completed]="day.completed">
                      <div class="day-card-header">
                        <div>
                          <p class="day-title">{{ day.label }}</p>
                          <p class="day-meta" *ngIf="day.workouts.length; else emptyMeta">
                            {{ day.workouts.length }} treinos - {{ day.totalExercises }} exercicios
                          </p>
                          <ng-template #emptyMeta>
                            <p class="day-meta">Sem treino cadastrado</p>
                          </ng-template>
                          <p class="day-last" *ngIf="day.completedAt">Ultimo treino: {{ day.completedAt | date:'dd/MM/yyyy' }}</p>
                        </div>
                        <div class="day-chip-group">
                          <span class="day-chip" *ngIf="day.code === currentDay">Hoje</span>
                          <span class="day-chip done" *ngIf="day.completed">Concluido</span>
                        </div>
                      </div>

                      <div class="day-actions">
                        <button
                          mat-flat-button
                          color="primary"
                          (click)="openDayModal(day)"
                        >
                          Ver treino
                        </button>
                      </div>
                    </mat-card>
                  </div>

                  <ng-template #loading><p>Carregando treinos...</p></ng-template>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <mat-tab label="Perfil">
            <div class="panel-grid">
              <mat-card class="panel">
                <mat-card-header>
                  <mat-card-title>Meu Perfil</mat-card-title>
                </mat-card-header>
                <mat-card-content *ngIf="profile; else profileLoading">
                  <p><strong>Nome:</strong> {{ profile.name }}</p>
                  <p><strong>Email:</strong> {{ profile.email }}</p>
                  <p><strong>Genero:</strong> {{ genderLabel(profile.gender) }}</p>
                  <p><strong>Data de nascimento:</strong> {{ profile.birthDate ? (profile.birthDate | date:'dd/MM/yyyy') : 'Nao informado' }}</p>
                  <p><strong>Idade:</strong> {{ profile.birthDate ? calculateAge(profile.birthDate) : 'Nao informado' }}</p>
                  <p><strong>Presencas:</strong> {{ profile.attendanceCount ?? 0 }}</p>
                  <p><strong>Ultimo check-in:</strong> {{ profile.lastCheckIn ? (profile.lastCheckIn | date:'dd/MM/yyyy') : 'Nao informado' }}</p>
                </mat-card-content>
                <ng-template #profileLoading>
                  <p class="muted">Carregando perfil...</p>
                </ng-template>
              </mat-card>

              <mat-card class="panel">
                <mat-card-header>
                  <mat-card-title>Editar Informacoes</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="profile-form">
                    <mat-form-field appearance="outline">
                      <mat-label>Nome</mat-label>
                      <input matInput formControlName="name" />
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Email</mat-label>
                      <input matInput formControlName="email" />
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Genero</mat-label>
                      <mat-select formControlName="gender">
                        <mat-option value="MALE">Masculino</mat-option>
                        <mat-option value="FEMALE">Feminino</mat-option>
                        <mat-option value="OTHER">Outro</mat-option>
                        <mat-option value="UNSPECIFIED">Prefiro nao dizer</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Data de nascimento</mat-label>
                      <input matInput type="date" formControlName="birthDate" />
                    </mat-form-field>

                    <div class="actions">
                      <button
                        mat-raised-button
                        color="primary"
                        type="submit"
                        [disabled]="profileForm.invalid || !profileForm.dirty || isSavingProfile"
                      >
                        {{ isSavingProfile ? 'Salvando...' : 'Salvar' }}
                      </button>
                    </div>
                  </form>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <mat-tab label="Duvidas">
            <div class="panel-grid">
              <mat-card class="panel">
                <mat-card-header>
                  <mat-card-title>Central de Duvidas</mat-card-title>
                  <mat-card-subtitle>Envie sua pergunta para o treinador</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <form [formGroup]="supportForm" (ngSubmit)="sendSupport()" class="support-form">
                    <mat-form-field appearance="outline">
                      <mat-label>Categoria</mat-label>
                      <mat-select formControlName="type">
                        <mat-option value="Treino">Treino</mat-option>
                        <mat-option value="Horario">Horario</mat-option>
                        <mat-option value="Equipamento">Equipamento</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Mensagem</mat-label>
                      <textarea matInput rows="4" formControlName="content"></textarea>
                    </mat-form-field>

                    <button mat-raised-button color="primary" [disabled]="supportForm.invalid">Enviar</button>
                  </form>
                </mat-card-content>
              </mat-card>

              <mat-card class="panel">
                <mat-card-header>
                  <mat-card-title>Respostas do Treinador</mat-card-title>
                  <mat-card-subtitle>Acompanhe as respostas enviadas</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div *ngIf="notifications$ | async as notes">
                    <div class="response" [class.pending-item]="!note.response" *ngFor="let note of notes">
                      <div class="response-header">
                        <strong>{{ note.type }}</strong>
                        <span class="date">{{ (note.respondedAt || note.createdAt) | date:'dd/MM/yyyy' }}</span>
                      </div>
                      <p class="question">{{ note.content }}</p>
                      <p class="answer" *ngIf="note.response; else waiting">Resposta: {{ note.response }}</p>
                      <ng-template #waiting>
                        <p class="pending">Aguardando resposta do treinador.</p>
                      </ng-template>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .dashboard-shell { padding: 24px; max-width: 1100px; margin: 0 auto; }
      .hero { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; padding-bottom: 10px; border-bottom: 1px solid rgba(225, 6, 0, 0.45); }
      .subtitle { color: #ff9b95; margin-top: 4px; letter-spacing: 0.04em; text-transform: uppercase; }
      .tabs-card { border-radius: 18px; padding: 8px 8px 16px; border: 1px solid rgba(225, 6, 0, 0.34); box-shadow: 0 20px 42px rgba(0, 0, 0, 0.42); }
      .panel-grid { display: grid; gap: 20px; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); margin-top: 10px; }
      .panel { border-radius: 16px; border: 1px solid #2d2d2d; box-shadow: 0 16px 32px rgba(0, 0, 0, 0.3); background: linear-gradient(180deg, #171717, #101010) !important; }
      .panel .mat-mdc-card-subtitle { color: #bdbdbd !important; opacity: 1 !important; }
      .panel .mat-mdc-card-title { color: #fff !important; }
      .day-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
      .day-card { padding: 16px; border-radius: 16px; border: 1px solid #2f2f2f; background: linear-gradient(180deg, #181818, #101010); display: grid; gap: 12px; }
      .day-card.today { border-color: #e10600; box-shadow: 0 16px 34px rgba(225, 6, 0, 0.24); }
      .day-card.completed { border-color: #d97706; }
      .day-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
      .day-title { font-weight: 700; margin: 0; }
      .day-meta { margin: 2px 0 0; font-size: 12px; color: #b7b7b7; }
      .day-last { margin: 6px 0 0; font-size: 12px; color: #fca5a5; font-weight: 700; }
      .day-chip { background: #e10600; color: #fff; font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 999px; }
      .day-chip-group { display: grid; gap: 6px; justify-items: end; }
      .day-chip.done { background: #d97706; }
      .day-actions { display: flex; justify-content: flex-end; }
      .day-actions .ghost { color: #ff6f68; }
      .workout { display: flex; flex-direction: column; gap: 6px; }
      .exercise { font-size: 13px; color: var(--siga-muted); }
      .empty { color: #9ca3af; }
      .support-form, .profile-form { display: grid; gap: 16px; }
      .profile-form .actions,
      .support-form button { justify-self: end; min-width: 170px; }
      .response { padding: 12px; border-bottom: 1px solid #2d2d2d; }
      .response:last-child { border-bottom: none; }
      .response-header { display: flex; justify-content: space-between; align-items: center; }
      .date { font-size: 12px; color: #9ca3af; }
      .question { margin: 6px 0; }
      .answer { color: #ff9b95; font-weight: 700; }
      .pending { color: #f59e0b; font-weight: 700; }
      .response.pending-item { background: rgba(245, 158, 11, 0.08); border-left: 3px solid #f59e0b; }
      .actions { display: flex; justify-content: flex-end; }
      .muted { color: #a3a3a3; }
      @media (max-width: 720px) {
        .dashboard-shell { padding: 16px; }
        .hero { flex-direction: column; align-items: flex-start; gap: 6px; }
      }
    `
  ]
})
export class DashboardHomeComponent implements OnInit {
  private workoutService = inject(WorkoutService);
  private notificationsService = inject(NotificationsService);
  private userProfileService = inject(UserProfileService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);


  currentDay = this.getCurrentDay();
  profile: any = null;
  isSavingProfile = false;

  supportForm = this.fb.group({
    type: ['Treino', Validators.required],
    content: ['', [Validators.required, Validators.minLength(5)]],
  });

  profileForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    gender: this.fb.nonNullable.control<'MALE' | 'FEMALE' | 'OTHER' | 'UNSPECIFIED'>('UNSPECIFIED'),
    birthDate: [''],
  });

  private completionRefresh$ = new BehaviorSubject<number>(0);
  private completionState = new Map<string, { completed: boolean; completedAt?: string }>();

  workoutsByDay$ = combineLatest([
    this.workoutService.getMyWorkouts(),
    this.completionRefresh$,
  ]).pipe(
    map(([workouts]) =>
      DAYS.map((day) => {
        const dayWorkouts = workouts.filter((workout) => workout.dayOfWeek === day.code);
        const totalWorkouts = dayWorkouts.length;
        const totalExercises = this.countExercises(dayWorkouts);
        const totalLoad = this.calculateTotalLoad(dayWorkouts);
        const state = this.getDayState(day.code);
        return {
          ...day,
          workouts: dayWorkouts,
          totalWorkouts,
          totalExercises,
          totalLoad,
          completed: state.completed,
          completedAt: state.completedAt,
        };
      })
    )
  );

  notifications$ = this.notificationsService.getMyNotifications().pipe(
    map((notes) => this.sortNotifications(notes))
  );

  ngOnInit(): void {
    this.loadProfile();
  }

  sendSupport() {
    if (this.supportForm.invalid) return;
    this.notificationsService.createNotification(this.supportForm.value as any).subscribe(() => {
      this.supportForm.reset({ type: 'Treino', content: '' });
      this.notifications$ = this.notificationsService.getMyNotifications().pipe(
        map((notes) => this.sortNotifications(notes))
      );
    });
  }

  openDayModal(day: any) {
    const dialogRef = this.dialog.open(WorkoutDayDialogComponent, {
      data: day,
      width: '92vw',
      maxWidth: '680px',
      autoFocus: false,
      panelClass: 'workout-modal',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      if (result.action === 'toggle') {
        this.setDayState(day.code, result.completed);
      }
      if (result.action === 'request') {
        this.requestWorkout(day);
      }
    });
  }

  requestWorkout(day: any) {
    const payload = {
      type: 'Treino',
      content: `Solicito treino para ${day.label}.`,
    };
    this.notificationsService.createNotification(payload as any).subscribe(() => {
      this.snackBar.open('Solicitacao enviada ao treinador.', 'OK', { duration: 2500 });
    }, () => {
      this.snackBar.open('Nao foi possivel enviar a solicitacao.', 'OK', { duration: 2500 });
    });
  }

  saveProfile() {
    if (this.profileForm.invalid) return;
    const payload = this.profileForm.getRawValue();
    if (!payload.birthDate) {
      delete (payload as any).birthDate;
    }
    this.isSavingProfile = true;
    this.userProfileService.updateMyProfile(payload).subscribe(() => {
      this.loadProfile();
      this.isSavingProfile = false;
      this.snackBar.open('Perfil atualizado com sucesso.', 'OK', { duration: 2000 });
    }, () => {
      this.isSavingProfile = false;
      this.snackBar.open('Nao foi possivel atualizar o perfil.', 'OK', { duration: 2000 });
    });
  }

  private loadProfile() {
    this.userProfileService.getMyProfile().subscribe((profile) => {
      queueMicrotask(() => {
        this.profile = profile;
        this.profileForm.patchValue({
          name: profile.name ?? '',
          email: profile.email ?? '',
          gender: profile.gender ?? 'UNSPECIFIED',
          birthDate: profile.birthDate ? profile.birthDate.slice(0, 10) : '',
        });
        this.profileForm.markAsPristine();
        this.cdr.markForCheck();
      });
    });
  }

  genderLabel(value?: string | null) {
    switch (value) {
      case 'MALE':
        return 'Masculino';
      case 'FEMALE':
        return 'Feminino';
      case 'OTHER':
        return 'Outro';
      case 'UNSPECIFIED':
        return 'Prefiro nao dizer';
      default:
        return 'Nao informado';
    }
  }

  calculateAge(date: string) {
    const birth = new Date(date);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age -= 1;
    }
    return age;
  }

  countExercises(workouts: any[]) {
    return workouts.reduce((total, workout) => total + (workout.exercises?.length || 0), 0);
  }

  private calculateTotalLoad(workouts: any[]) {
    return workouts.reduce((total, workout) => {
      const load = (workout.exercises || []).reduce((sum: number, ex: any) => {
        const reps = this.parseReps(ex.reps);
        const sets = Number(ex.sets) || 0;
        const weight = Number(ex.weight) || 0;
        if (!reps || !sets || !weight) return sum;
        return sum + reps * sets * weight;
      }, 0);
      return total + load;
    }, 0);
  }

  private parseReps(value: any) {
    const text = String(value ?? '').trim();
    const match = text.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  }

  private getDayState(code: string) {
    return this.completionState.get(code) ?? { completed: false, completedAt: undefined };
  }

  private setDayState(code: string, completed: boolean) {
    if (completed) {
      this.completionState.set(code, { completed: true, completedAt: new Date().toISOString() });
    } else {
      this.completionState.set(code, { completed: false, completedAt: undefined });
    }
    this.completionRefresh$.next(Date.now());
  }

  private getCurrentDay() {
    const day = new Date().getDay();
    const mapping = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return mapping[day] ?? 'MON';
  }

  private sortNotifications(notes: any[]) {
    return [...notes].sort((a, b) => {
      const aPending = a.response ? 1 : 0;
      const bPending = b.response ? 1 : 0;
      if (aPending !== bPending) return aPending - bPending;

      const aDate = new Date(a.respondedAt || a.createdAt).getTime();
      const bDate = new Date(b.respondedAt || b.createdAt).getTime();
      return bDate - aDate;
    });
  }
}

@Component({
  selector: 'app-workout-day-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title class="modal-title">{{ data?.label }}</h2>
      <button mat-icon-button mat-dialog-close aria-label="Fechar">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <p class="modal-summary">
      {{ data?.totalWorkouts || 0 }} treinos - {{ data?.totalExercises || 0 }} exercicios
    </p>
    <mat-dialog-content class="modal-body">
      <ng-container *ngIf="data?.workouts?.length; else emptyDayModal">
        <div class="modal-workout" *ngFor="let workout of data.workouts">
          <div class="modal-workout-head">
            <div>
              <strong>{{ workout.title }}</strong>
              <p class="modal-workout-desc" *ngIf="workout.description">{{ workout.description }}</p>
            </div>
            <span class="workout-tag">{{ workout.exercises.length || 0 }} exercicios</span>
          </div>
          <div class="modal-exercise" *ngFor="let ex of workout.exercises">
            <div class="exercise-left">
              <span class="exercise-name">{{ ex.name }}</span>
              <button
                mat-icon-button
                class="help-btn"
                (click)="openExerciseHelp(ex.name)"
                [disabled]="isLoadingHelp(ex.name)"
                aria-label="Ver ajuda do exercicio"
              >
                <mat-icon>{{ isLoadingHelp(ex.name) ? 'hourglass_top' : 'help_outline' }}</mat-icon>
              </button>
            </div>
            <div class="exercise-right">
              <div class="series-counter">
                <button
                  mat-icon-button
                  class="series-btn"
                  (click)="decrementSeries(ex)"
                  [disabled]="currentSeries(ex) === 0"
                  aria-label="Diminuir serie"
                >
                  <mat-icon>remove</mat-icon>
                </button>
                <span class="series-count">{{ currentSeries(ex) }}/{{ ex.sets }} series</span>
                <button
                  mat-icon-button
                  class="series-btn"
                  (click)="incrementSeries(ex)"
                  [disabled]="currentSeries(ex) >= (ex.sets || 0)"
                  aria-label="Aumentar serie"
                >
                  <mat-icon>add</mat-icon>
                </button>
              </div>
              <span class="exercise-meta">{{ ex.reps }} - {{ ex.weight || 0 }}kg</span>
              <mat-icon class="exercise-check" *ngIf="currentSeries(ex) >= (ex.sets || 0)">check_circle</mat-icon>
            </div>
          </div>
        </div>
      </ng-container>
      <ng-template #emptyDayModal>
        <p class="empty">Sem treino cadastrado para este dia.</p>
      </ng-template>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="modal-actions">
      <button
        mat-stroked-button
        color="primary"
        *ngIf="data?.workouts?.length"
        (click)="toggleComplete()"
      >
        {{ data?.completed ? 'Desmarcar concluido' : 'Concluir treino' }}
      </button>
      <button
        mat-flat-button
        color="primary"
        *ngIf="!data?.workouts?.length"
        (click)="requestWorkout()"
      >
        Solicitar treino
      </button>
      <button mat-stroked-button color="primary" mat-dialog-close>Fechar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 4px 0 0; }
      .modal-title { margin: 0; font-size: 22px; font-weight: 800; color: #fff; text-shadow: 0 0 2px rgba(0, 0, 0, 0.75); }
      .modal-summary { margin: 4px 0 0; font-size: 12px; color: #b5b5b5; }
      .modal-body { display: grid; gap: 16px; padding: 8px 0 0; margin: 0; }
      .modal-workout { padding: 12px; border-radius: 12px; background: linear-gradient(180deg, #171717, #121212); border: 1px solid #2f2f2f; display: grid; gap: 10px; }
      .modal-workout-head { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
      .modal-workout-desc { margin: 4px 0 0; color: #b7b7b7; }
      .workout-tag { font-size: 11px; font-weight: 700; color: #ffd2cf; background: rgba(225, 6, 0, 0.25); padding: 4px 8px; border-radius: 999px; height: fit-content; }
      .modal-exercise { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; font-size: 13px; color: #e4e4e4; align-items: center; }
      .exercise-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
      .help-btn { width: 28px; height: 28px; }
      .exercise-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
      .series-counter { display: grid; grid-template-columns: 28px minmax(88px, auto) 28px; align-items: center; gap: 6px; background: rgba(225, 6, 0, 0.1); border: 1px solid rgba(225, 6, 0, 0.5); padding: 4px 8px; border-radius: 999px; }
      .series-count { font-size: 12px; font-weight: 700; color: #ffd2cf; min-width: 88px; text-align: center; line-height: 1; }
      .series-btn { width: 28px; height: 28px; padding: 0; display: inline-flex; align-items: center; justify-content: center; }
      .series-btn mat-icon { margin: 0; font-size: 18px; width: 18px; height: 18px; line-height: 18px; }
      .exercise-name { font-weight: 600; }
      .exercise-meta { color: #b5b5b5; }
      .exercise-check { color: #f59e0b; font-size: 18px; }
      .modal-actions { display: flex; justify-content: flex-end; padding-top: 12px; margin: 0; gap: 8px; }
      @media (max-width: 720px) {
        .modal-exercise { grid-template-columns: 1fr; }
        .exercise-right { justify-content: flex-start; }
      }
    `,
  ],
})
export class WorkoutDayDialogComponent {
  data = inject(MAT_DIALOG_DATA) as any;
  private dialogRef = inject(MatDialogRef<WorkoutDayDialogComponent>);
  private dialog = inject(MatDialog);
  private exerciseHelpService = inject(ExerciseHelpService);
  private cdr = inject(ChangeDetectorRef);
  private seriesProgress = new Map<string, number>();
  private loadingHelpByExercise = new Map<string, boolean>();
  private readonly storageKey = 'siga.seriesProgress.v1';

  constructor() {
    this.loadProgress();
  }

  toggleComplete() {
    this.dialogRef.close({ action: 'toggle', completed: !this.data?.completed });
  }

  requestWorkout() {
    this.dialogRef.close({ action: 'request' });
  }

  isLoadingHelp(name: string) {
    return this.loadingHelpByExercise.get(name) ?? false;
  }

  openExerciseHelp(name: string) {
    const exerciseName = (name || '').trim();
    if (!exerciseName) return;
    this.setHelpLoading(exerciseName, true);
    this.exerciseHelpService.getByName(exerciseName).pipe(
      finalize(() => {
        queueMicrotask(() => this.setHelpLoading(exerciseName, false));
      })
    ).subscribe({
      next: (response) => {
        this.dialog.open(ExerciseHelpDialogComponent, {
          width: '92vw',
          maxWidth: '720px',
          autoFocus: false,
          panelClass: 'workout-modal',
          data: {
            exerciseName,
            found: response.found,
            details: response.data,
            suggestions: response.suggestions ?? [],
          },
        });
      },
      error: (err) => {
        const backendMessage = this.extractErrorMessage(err);
        this.dialog.open(ExerciseHelpDialogComponent, {
          width: '92vw',
          maxWidth: '720px',
          autoFocus: false,
          panelClass: 'workout-modal',
          data: {
            exerciseName,
            found: false,
            details: null,
            suggestions: [],
            error: backendMessage || 'Nao foi possivel carregar ajuda agora.',
          },
        });
      },
    });
  }

  currentSeries(ex: any) {
    if (!ex?.id) return 0;
    return this.seriesProgress.get(ex.id) ?? 0;
  }

  incrementSeries(ex: any) {
    if (!ex?.id) return;
    const sets = Number(ex.sets) || 0;
    const current = this.currentSeries(ex);
    if (current >= sets) return;
    this.seriesProgress.set(ex.id, current + 1);
    this.persistProgress();
  }

  decrementSeries(ex: any) {
    if (!ex?.id) return;
    const current = this.currentSeries(ex);
    if (current <= 0) return;
    this.seriesProgress.set(ex.id, current - 1);
    this.persistProgress();
  }

  private loadProgress() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, number>;
      Object.entries(parsed).forEach(([id, value]) => {
        if (typeof value === 'number' && value >= 0) {
          this.seriesProgress.set(id, value);
        }
      });
    } catch {
      // ignore storage errors
    }
  }

  private persistProgress() {
    try {
      const payload: Record<string, number> = {};
      this.seriesProgress.forEach((value, key) => {
        payload[key] = value;
      });
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }

  private extractErrorMessage(err: any): string | null {
    const message = err?.error?.message;
    if (Array.isArray(message)) return message.join(' | ');
    if (typeof message === 'string' && message.trim()) return message.trim();
    return null;
  }

  private setHelpLoading(exerciseName: string, loading: boolean): void {
    // Defer to next tick to avoid ExpressionChangedAfterItHasBeenCheckedError.
    setTimeout(() => {
      this.loadingHelpByExercise.set(exerciseName, loading);
      this.cdr.markForCheck();
    }, 0);
  }

}

@Component({
  selector: 'app-exercise-help-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title class="modal-title">Ajuda: {{ data.exerciseName }}</h2>
      <button mat-icon-button mat-dialog-close aria-label="Fechar">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <mat-dialog-content class="help-body" *ngIf="data.found && data.details; else notFound">
      <div class="help-grid">
        <div class="help-item"><strong>Equipamento:</strong> {{ data.details.equipment }}</div>
        <div class="help-item"><strong>Musculo alvo:</strong> {{ data.details.target }}</div>
        <div class="help-item"><strong>Regiao:</strong> {{ data.details.bodyPart }}</div>
      </div>

      <div class="help-media" *ngIf="data.details.gifUrl">
        <img [src]="data.details.gifUrl" [alt]="data.details.name" />
      </div>

      <div class="help-section" *ngIf="data.details.instructions.length">
        <h3>Como executar</h3>
        <ol>
          <li *ngFor="let step of data.details.instructions">{{ step }}</li>
        </ol>
      </div>

      <div class="help-section" *ngIf="data.details.secondaryMuscles.length">
        <h3>Musculos secundarios</h3>
        <p>{{ data.details.secondaryMuscles.join(', ') }}</p>
      </div>
    </mat-dialog-content>

    <ng-template #notFound>
      <mat-dialog-content class="help-body">
        <p>{{ data.error || 'Nao encontramos detalhes para este exercicio.' }}</p>
        <p *ngIf="data.suggestions.length">
          Sugestoes: {{ data.suggestions.join(', ') }}
        </p>
      </mat-dialog-content>
    </ng-template>

    <mat-dialog-actions align="end">
      <button mat-stroked-button color="primary" mat-dialog-close>Fechar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .help-body { display: grid; gap: 12px; }
      .help-grid { display: grid; gap: 8px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
      .help-item { font-size: 13px; color: #e5e5e5; background: linear-gradient(180deg, #181818, #111111); border: 1px solid #2f2f2f; border-radius: 10px; padding: 10px; }
      .help-media img { width: 100%; max-width: 420px; border-radius: 12px; border: 1px solid #303030; }
      .help-section h3 { margin: 0 0 6px; font-size: 14px; }
      .help-section ol { margin: 0; padding-left: 18px; display: grid; gap: 4px; }
      .help-section p { margin: 0; color: #c4c4c4; }
    `,
  ],
})
export class ExerciseHelpDialogComponent {
  data = inject(MAT_DIALOG_DATA) as {
    exerciseName: string;
    found: boolean;
    details: ExerciseHelpData | null;
    suggestions: string[];
    error?: string;
  };
}




