import { ChangeDetectorRef, Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AdminUsersService, AdminStudent } from '../../../core/services/admin-users.service';

@Component({
  selector: 'app-student-profile-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatCardModule],
  template: `
    <h2 mat-dialog-title>Perfil do Aluno</h2>
    <div mat-dialog-content class="content" *ngIf="profile; else loading">
      <mat-card class="section">
        <mat-card-title>{{ profile.name }}</mat-card-title>
        <mat-card-content>
          <p>Email: {{ profile.email }}</p>
          <p>Genero: {{ genderLabel(profile.gender) }}</p>
          <p>Data de nascimento: {{ profile.birthDate ? (profile.birthDate | date:'dd/MM/yyyy') : 'Nao informado' }}</p>
          <p>Idade: {{ profile.birthDate ? calculateAge(profile.birthDate) : 'Nao informado' }}</p>
        </mat-card-content>
      </mat-card>

      <mat-card class="section">
        <mat-card-title>Frequencia</mat-card-title>
        <mat-card-content>
          <p>Total de presencas: {{ profile.attendanceCount ?? 0 }}</p>
          <p>Ultimo check-in: {{ profile.lastCheckIn ? (profile.lastCheckIn | date:'dd/MM/yyyy') : 'Nao informado' }}</p>
          <p>Ultima resposta do treinador: {{ profile.lastResponseAt ? (profile.lastResponseAt | date:'dd/MM/yyyy') : 'Nao informado' }}</p>
          <div class="recent" *ngIf="profile.recentCheckIns?.length">
            <span class="muted">Ultimos check-ins:</span>
            <div class="chips">
              <span class="chip" *ngFor="let item of profile.recentCheckIns">
                {{ item | date:'dd/MM' }}
              </span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <ng-template #loading>
      <div class="loading">Carregando perfil...</div>
    </ng-template>

    <div mat-dialog-actions align="end">
      <button mat-stroked-button color="primary" type="button" (click)="close()">Fechar</button>
    </div>
  `,
  styles: [
    `
      .content { display: grid; gap: 12px; }
      .section { padding: 12px; border-radius: 12px; border: 1px solid #2f2f2f; background: linear-gradient(180deg, #171717, #101010); }
      .loading { padding: 12px 0; color: #a3a3a3; }
      h2[mat-dialog-title],
      .mat-mdc-dialog-title {
        color: #ffffff !important;
        font-size: 42px;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-shadow: 0 0 2px rgba(0, 0, 0, 0.85);
      }
      mat-card-title { font-size: 22px; margin-bottom: 6px; color: #ffffff; font-weight: 800; }
      p { margin: 4px 0; }
      .recent { margin-top: 8px; display: grid; gap: 6px; }
      .chips { display: flex; flex-wrap: wrap; gap: 6px; }
      .chip {
        background: linear-gradient(180deg, #323232, #1f1f1f);
        color: #ff6b6b;
        border: 1px solid rgba(225, 6, 0, 0.7);
        padding: 4px 8px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
      }
      .muted { color: #b5b5b5; font-size: 12px; }
      h2 { color: #fff; }
    `
  ]
})
export class StudentProfileDialogComponent implements OnInit {
  private usersService = inject(AdminUsersService);
  private dialogRef = inject(MatDialogRef<StudentProfileDialogComponent>);
  private cdr = inject(ChangeDetectorRef);

  profile: any;

  constructor(@Inject(MAT_DIALOG_DATA) public data: AdminStudent) {}

  ngOnInit(): void {
    this.usersService.getStudentProfile(this.data.id).subscribe((profile) => {
      queueMicrotask(() => {
        this.profile = profile;
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

  close() {
    this.dialogRef.close(false);
  }
}
