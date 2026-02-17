import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NotificationsService, NotificationItem } from '../../../core/services/notifications.service';
import { StudentNotificationsDialogComponent } from './student-notifications-dialog.component';

@Component({
  selector: 'app-notifications-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatBadgeModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <mat-card class="panel">
      <mat-card-header>
        <mat-card-title>Notificacoes</mat-card-title>
        <mat-card-subtitle>Responda as duvidas dos alunos</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="toolbar">
          <div class="toolbar-actions">
            <span class="count">{{ notifications.length }} mensagens</span>
          </div>
        </div>

        <div *ngIf="notifications.length; else empty">
          <div class="students">
            <div class="student-card" *ngFor="let group of groupedByStudent">
              <div class="student-info">
                <strong>{{ group.studentLabel }}</strong>
                <span class="muted">{{ group.totalCount }} mensagem(ns)</span>
              </div>
              <button
                mat-raised-button
                color="primary"
                (click)="openStudentDialog(group)"
                [matBadge]="group.pendingCount"
                matBadgeColor="warn"
                [matBadgeHidden]="group.pendingCount === 0"
                matBadgeOverlap="false"
              >
                Ver duvidas
              </button>
            </div>
          </div>
        </div>

        <ng-template #empty>
          <div class="empty">Sem notificacoes no momento.</div>
        </ng-template>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .panel { border-radius: 16px; border: 1px solid #2e2e2e; box-shadow: 0 16px 32px rgba(0, 0, 0, 0.32); }
      .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 8px 0 16px; flex-wrap: wrap; }
      .toolbar-actions { display: flex; align-items: center; gap: 12px; }
      .count { color: #b8b8b8; font-size: 13px; }
      .students { display: grid; gap: 12px; }
      .student-card { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border: 1px solid #2f2f2f; border-radius: 12px; background: linear-gradient(180deg, #181818, #101010); }
      .student-info { display: grid; gap: 2px; }
      .muted { color: #b8b8b8; font-size: 12px; }
      .empty { padding: 20px; color: #9ca3af; text-align: center; }

      @media (max-width: 720px) {
        .toolbar-actions { width: 100%; justify-content: space-between; }
        .student-card { flex-direction: column; align-items: flex-start; }
      }
    `
  ]
})
export class NotificationsPanelComponent {
  private notificationsService = inject(NotificationsService);
  private dialog = inject(MatDialog);

  @Output() updated = new EventEmitter<void>();

  notifications: NotificationItem[] = [];
  get groupedByStudent() {
    return this.groupByStudent(this.notifications);
  }

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.notificationsService.getNotifications(false).subscribe((items) => {
      this.notifications = items;
      this.updated.emit();
    });
  }

  openStudentDialog(group: {
    studentLabel: string;
    items: NotificationItem[];
    pendingCount: number;
    totalCount: number;
  }) {
    const dialogRef = this.dialog.open(StudentNotificationsDialogComponent, {
      width: '720px',
      panelClass: 'admin-modal',
      data: group,
    });

    dialogRef.afterClosed().subscribe((updated: boolean | undefined) => {
      if (updated) this.load();
    });
  }

  private groupByStudent(items: NotificationItem[]) {
    const map = new Map<
      string,
      { studentLabel: string; items: NotificationItem[]; pendingCount: number; totalCount: number }
    >();
    items.forEach((item) => {
      const key = item.user?.id ?? 'unknown';
      const label = item.user ? `${item.user.name} (${item.user.email})` : 'Aluno desconhecido';
      if (!map.has(key)) {
        map.set(key, { studentLabel: label, items: [], pendingCount: 0, totalCount: 0 });
      }
      const entry = map.get(key)!;
      entry.items.push(item);
      entry.totalCount += 1;
      if (!item.response) entry.pendingCount += 1;
    });
    return Array.from(map.values()).map((group) => ({
      ...group,
      items: this.sortNotifications(group.items),
    }));
  }

  private sortNotifications(items: NotificationItem[]) {
    return [...items].sort((a, b) => {
      const aPending = a.response ? 1 : 0;
      const bPending = b.response ? 1 : 0;
      if (aPending !== bPending) return aPending - bPending;

      const aDate = new Date(a.respondedAt || a.createdAt).getTime();
      const bDate = new Date(b.respondedAt || b.createdAt).getTime();
      return bDate - aDate;
    });
  }
}

