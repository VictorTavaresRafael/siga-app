import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { AdminUsersService, AdminStudent } from '../../../core/services/admin-users.service';
import { StudentEditDialogComponent } from '../student-edit-dialog/student-edit-dialog.component';
import { WorkoutEditorComponent } from '../workout-editor/workout-editor.component';
import { StudentCreateDialogComponent } from '../student-create-dialog/student-create-dialog.component';
import { StudentProfileDialogComponent } from '../student-profile-dialog/student-profile-dialog.component';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCardModule,
  ],
  template: `
    <mat-card class="student-card">
      <div class="header">
        <div>
          <h3>Gestao de Alunos</h3>
          <p class="muted">Edite dados, treinos e status de acesso.</p>
        </div>
        <button mat-raised-button color="primary" (click)="createStudent()">Novo aluno</button>
      </div>

      <mat-form-field appearance="outline" class="filter">
        <mat-label>Buscar aluno</mat-label>
        <input matInput (keyup)="applyFilter($event)" placeholder="Nome ou email" />
      </mat-form-field>

      <div class="table-wrap">
        <table mat-table [dataSource]="dataSource" matSort>
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Nome</th>
            <td mat-cell *matCellDef="let student">
              <button mat-button color="primary" class="name-btn" (click)="openProfile(student)">
                {{ student.name }}
              </button>
            </td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Email</th>
            <td mat-cell *matCellDef="let student">{{ student.email }}</td>
          </ng-container>

          <ng-container matColumnDef="active">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let student">{{ student.isActive ? 'Ativo' : 'Inativo' }}</td>
          </ng-container>

          <ng-container matColumnDef="workouts">
            <th mat-header-cell *matHeaderCellDef>Treinos</th>
            <td mat-cell *matCellDef="let student">{{ student.workoutsCount }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acoes</th>
            <td mat-cell *matCellDef="let student" class="actions">
              <button mat-icon-button color="primary" (click)="editStudent(student)" aria-label="Editar aluno">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="accent" (click)="editWorkout(student)" aria-label="Editar treino">
                <mat-icon>fitness_center</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deactivateStudent(student)" aria-label="Desativar aluno">
                <mat-icon>block</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
      </div>

      <mat-paginator [pageSize]="10" [pageSizeOptions]="[5, 10, 25]"></mat-paginator>
    </mat-card>
  `,
  styles: [
    `
      .student-card { padding: 20px; border-radius: 16px; border: 1px solid #2e2e2e; box-shadow: 0 16px 32px rgba(0, 0, 0, 0.32); }
      .header { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 8px; flex-wrap: wrap; }
      .muted { color: var(--siga-muted); margin: 4px 0 0; }
      .filter { width: 320px; margin: 12px 0; }
      .table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid #2f2f2f; background: linear-gradient(180deg, #151515, #101010); }
      .actions { display: flex; gap: 4px; }
      .name-btn { padding: 0; min-width: auto; }
      table { width: 100%; min-width: 640px; border-collapse: collapse; background: #111 !important; }
      .mat-mdc-table { background: #111 !important; }
      .mdc-data-table__content { background: #111 !important; }
      .mdc-data-table__row, .mdc-data-table__header-row { background: #111 !important; }
      th, td { padding: 12px 16px; color: #efefef; }
      .mat-mdc-header-cell, .mat-mdc-cell { color: #efefef !important; border-bottom-color: #2a2a2a !important; }
      th { color: #ff9b95; font-weight: 700; }
      tr.mat-header-row { background: #111111; }
      tr.mat-row { border-bottom: 1px solid #2a2a2a; background: rgba(255, 255, 255, 0.01); }
      tr.mat-row:last-child { border-bottom: none; }
      .actions button { color: #ff4d4f !important; }
      .actions button[color='warn'] { color: #ef4444 !important; }
      .mat-mdc-paginator {
        background: #111 !important;
        color: #efefef !important;
        border-top: 1px solid #2a2a2a;
      }
      .mat-mdc-paginator .mat-mdc-select-value-text,
      .mat-mdc-paginator .mat-mdc-paginator-page-size-label,
      .mat-mdc-paginator .mat-mdc-paginator-range-label {
        color: #efefef !important;
      }
      .mat-mdc-paginator .mat-mdc-icon-button {
        color: #ff4d4f !important;
      }

      @media (max-width: 720px) {
        .filter { width: 100%; }
      }
    `
  ]
})
export class StudentListComponent implements OnInit {
  private usersService = inject(AdminUsersService);
  private dialog = inject(MatDialog);

  displayedColumns = ['name', 'email', 'active', 'workouts', 'actions'];
  dataSource = new MatTableDataSource<AdminStudent>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.loadStudents();
  }

  ngAfterViewInit(): void {
    this.bindTableControls();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  loadStudents() {
    this.usersService.getStudents().subscribe((students) => {
      this.dataSource.data = Array.isArray(students) ? students : [];
      this.bindTableControls();
    });
  }

  private bindTableControls() {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  createStudent() {
    const dialogRef = this.dialog.open(StudentCreateDialogComponent, {
      width: '420px',
      panelClass: 'admin-modal',
    });

    dialogRef.afterClosed().subscribe((created) => {
      if (created) this.loadStudents();
    });
  }

  editStudent(student: AdminStudent) {
    const dialogRef = this.dialog.open(StudentEditDialogComponent, {
      width: '420px',
      panelClass: 'admin-modal',
      data: student,
    });

    dialogRef.afterClosed().subscribe((updated) => {
      if (updated) this.loadStudents();
    });
  }

  editWorkout(student: AdminStudent) {
    const dialogRef = this.dialog.open(WorkoutEditorComponent, {
      width: '720px',
      panelClass: 'workout-modal',
      data: student,
    });

    dialogRef.afterClosed().subscribe((updated) => {
      if (updated) this.loadStudents();
    });
  }

  deactivateStudent(student: AdminStudent) {
    this.usersService.deactivateStudent(student.id).subscribe(() => this.loadStudents());
  }

  openProfile(student: AdminStudent) {
    this.dialog.open(StudentProfileDialogComponent, {
      width: '560px',
      panelClass: 'admin-modal',
      data: student,
    });
  }
}

