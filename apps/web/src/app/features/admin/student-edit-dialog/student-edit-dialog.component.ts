import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { AdminUsersService, AdminStudent } from '../../../core/services/admin-users.service';

@Component({
  selector: 'app-student-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>Editar Aluno</h2>
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

      <mat-checkbox formControlName="isActive">Aluno ativo</mat-checkbox>

      <div class="actions">
        <button mat-stroked-button color="primary" type="button" (click)="close()">Cancelar</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Salvar</button>
      </div>
    </form>
  `,
  styles: [
    `
      .dialog-form { display: flex; flex-direction: column; gap: 18px; margin-top: 12px; }
      .actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 4px; }
      h2 { color: #fff; }
    `
  ]
})
export class StudentEditDialogComponent {
  private fb = inject(FormBuilder);
  private usersService = inject(AdminUsersService);
  private dialogRef = inject(MatDialogRef<StudentEditDialogComponent>);
  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    gender: this.fb.nonNullable.control<'MALE' | 'FEMALE' | 'OTHER' | 'UNSPECIFIED'>('UNSPECIFIED'),
    birthDate: [''],
    isActive: [true],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: AdminStudent) {
    this.form.patchValue({
      name: data.name,
      email: data.email,
      gender: data.gender ?? 'UNSPECIFIED',
      birthDate: data.birthDate ? data.birthDate.slice(0, 10) : '',
      isActive: data.isActive,
    });
  }

  save() {
    if (this.form.invalid) return;
    const payload = this.form.getRawValue();
    if (!payload.birthDate) {
      delete (payload as any).birthDate;
    }
    this.usersService.updateStudent(this.data.id, payload).subscribe(() => {
      this.dialogRef.close(true);
    });
  }

  close() {
    this.dialogRef.close(false);
  }
}
