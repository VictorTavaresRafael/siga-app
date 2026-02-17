import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { NotificationsService, NotificationItem } from '../../../core/services/notifications.service';

@Component({
  selector: 'app-student-notifications-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Duvidas - {{ data.studentLabel }}</h2>
    <div mat-dialog-content class="content">
      <div class="item" [class.pending-item]="!item.response" *ngFor="let item of data.items">
        <div class="item-header">
          <div>
            <strong>{{ item.type }}</strong>
            <span class="status" [class.done]="!!item.response">
              {{ item.response ? 'Respondida' : 'Pendente' }}
            </span>
          </div>
          <span class="date">
            {{ item.respondedAt ? (item.respondedAt | date:'dd/MM/yyyy') : (item.createdAt | date:'dd/MM/yyyy') }}
          </span>
        </div>

        <p class="question">{{ item.content }}</p>

        <div class="reply" *ngIf="item.response; else replyForm">
          <p class="answer">Resposta enviada: {{ item.response }}</p>
        </div>

        <ng-template #replyForm>
          <mat-form-field appearance="outline">
            <mat-label>Resposta</mat-label>
            <textarea matInput rows="3" [formControl]="getReplyControl(item.id)"></textarea>
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="sendReply(item)">Enviar resposta</button>
        </ng-template>
      </div>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-stroked-button color="primary" type="button" (click)="close()">Fechar</button>
    </div>
  `,
  styles: [
    `
      .content { display: grid; gap: 16px; }
      .item { background: linear-gradient(180deg, #171717, #101010); border: 1px solid #2f2f2f; border-radius: 14px; padding: 16px; display: grid; gap: 10px; }
      .item-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
      .status { margin-left: 8px; padding: 2px 8px; border-radius: 999px; background: rgba(245, 158, 11, 0.2); color: #fcd34d; font-size: 12px; font-weight: 700; }
      .status.done { background: rgba(34, 197, 94, 0.18); color: #86efac; }
      .item.pending-item { background: rgba(245, 158, 11, 0.08); border-left: 3px solid #f59e0b; }
      .date { color: #a3a3a3; font-size: 12px; }
      .question { margin: 0; color: #f3f4f6; }
      .answer { color: #ffb4af; font-weight: 700; margin: 0; }
      h2 { color: #fff; }
    `
  ]
})
export class StudentNotificationsDialogComponent {
  private notificationsService = inject(NotificationsService);
  private dialogRef = inject(MatDialogRef<StudentNotificationsDialogComponent>);

  replyControls = new Map<string, FormControl<string>>();
  updated = false;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { studentLabel: string; items: NotificationItem[] }
  ) {}

  getReplyControl(id: string) {
    if (!this.replyControls.has(id)) {
      this.replyControls.set(id, new FormControl('', { nonNullable: true }));
    }
    return this.replyControls.get(id)!;
  }

  sendReply(item: NotificationItem) {
    const control = this.getReplyControl(item.id);
    const response = control.value.trim();
    if (!response) return;
    this.notificationsService.reply(item.id, response).subscribe(() => {
      control.setValue('');
      item.response = response;
      item.respondedAt = new Date().toISOString();
      this.data.items = this.sortNotifications(this.data.items);
      this.updated = true;
    });
  }

  close() {
    this.dialogRef.close(this.updated);
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
