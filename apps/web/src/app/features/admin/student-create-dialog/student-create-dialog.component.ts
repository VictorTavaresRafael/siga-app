import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { AdminUsersService } from '../../../core/services/admin-users.service';

@Component({
  selector: 'app-student-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>Novo Aluno</h2>
    <form [formGroup]="form" (ngSubmit)="save()" class="dialog-form">
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

      <mat-form-field appearance="outline">
        <mat-label>Senha</mat-label>
        <input matInput type="password" formControlName="password" />
      </mat-form-field>

      <div class="actions">
        <button mat-stroked-button color="primary" type="button" (click)="close()">Cancelar</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Criar</button>
      </div>
    </form>
  `,
  styles: [
    `
      .dialog-form { display: flex; flex-direction: column; gap: 16px; margin-top: 8px; }
      .actions { display: flex; justify-content: flex-end; gap: 8px; }
      h2 { color: #fff; }
    `
  ]
})
export class StudentCreateDialogComponent {
  private fb = inject(FormBuilder);
  private usersService = inject(AdminUsersService);
  private dialogRef = inject(MatDialogRef<StudentCreateDialogComponent>);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    gender: this.fb.nonNullable.control<'MALE' | 'FEMALE' | 'OTHER' | 'UNSPECIFIED'>('UNSPECIFIED'),
    birthDate: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  save() {
    if (this.form.invalid) return;
    const payload = this.form.getRawValue();
    if (!payload.birthDate) {
      delete (payload as any).birthDate;
    }
    this.usersService.createStudent(payload).subscribe(() => {
      this.dialogRef.close(true);
    });
  }

  close() {
    this.dialogRef.close(false);
  }
}
