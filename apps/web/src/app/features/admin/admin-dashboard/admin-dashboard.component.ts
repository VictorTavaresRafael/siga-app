import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { FrequencyChartComponent } from '../../dashboard/frequency-chart/frequency-chart.component';
import { StudentListComponent } from '../student-list/student-list.component';
import { NotificationsPanelComponent } from '../notifications-panel/notifications-panel.component';
import { NotificationsService } from '../../../core/services/notifications.service';
import { AnalyticsService } from '../../../core/services/analytics.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatBadgeModule,
    FrequencyChartComponent,
    StudentListComponent,
    NotificationsPanelComponent,
  ],
  template: `
    <div class="admin-shell">
      <header class="hero">
        <div>
          <h1>Painel Admin</h1>
          <p class="subtitle">Controle de alunos, treinos e presencas em um so lugar.</p>
        </div>
      </header>

      <mat-card class="tabs-card">
        <mat-tab-group>
          <mat-tab label="Dashboard">
            <div class="grid">
              <div class="kpis">
                <mat-card class="kpi">
                  <span class="kpi-label">Alunos ativos</span>
                  <strong class="kpi-value">{{ summary.studentsActive }}</strong>
                </mat-card>
                <mat-card class="kpi">
                  <span class="kpi-label">Check-ins hoje</span>
                  <strong class="kpi-value">{{ summary.checkInsToday }}</strong>
                </mat-card>
                <mat-card class="kpi">
                  <span class="kpi-label">Duvidas pendentes</span>
                  <strong class="kpi-value">{{ summary.pendingQuestions }}</strong>
                </mat-card>
              </div>

              <mat-card class="panel qr-panel">
                <mat-card-header>
                  <mat-card-title>QR Code do Dia</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <p class="qr-code">{{ dailyCode }}</p>
                  <img class="qr-image" [src]="qrCodeUrl" alt="QR Code do dia" />
                </mat-card-content>
              </mat-card>

              <mat-card class="panel chart-panel">
                <mat-card-content>
                  <app-frequency-chart></app-frequency-chart>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <mat-tab label="Alunos">
            <app-student-list></app-student-list>
          </mat-tab>

          <mat-tab>
            <ng-template mat-tab-label>
              Notificacoes
              <span *ngIf="unreadCount > 0" matBadge matBadgeColor="warn" matBadgeOverlap="false"></span>
            </ng-template>
            <app-notifications-panel (updated)="refreshUnread()"></app-notifications-panel>
          </mat-tab>
        </mat-tab-group>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .admin-shell { padding: 24px; max-width: 1200px; margin: 0 auto; }
      .hero { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; padding-bottom: 10px; border-bottom: 1px solid rgba(225, 6, 0, 0.45); }
      .subtitle { color: #ff9b95; margin-top: 4px; letter-spacing: 0.04em; text-transform: uppercase; }
      .tabs-card { border-radius: 18px; padding: 8px 8px 16px; border: 1px solid rgba(225, 6, 0, 0.34); box-shadow: 0 20px 42px rgba(0, 0, 0, 0.42); }
      .grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 20px; margin-top: 10px; }
      .panel { padding: 10px; border-radius: 16px; border: 1px solid #2d2d2d; box-shadow: 0 16px 32px rgba(0, 0, 0, 0.3); }
      .chart-panel { grid-column: 1 / -1; }
      .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
      .kpi { padding: 14px; border-radius: 14px; border: 1px solid #2f2f2f; background: linear-gradient(180deg, #181818, #101010); box-shadow: 0 16px 28px rgba(0, 0, 0, 0.32); display: grid; gap: 6px; }
      .kpi-label { color: #b7b7b7; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
      .kpi-value { font-size: 24px; color: var(--siga-text); }
      .qr-code { font-weight: 600; margin-bottom: 10px; color: var(--siga-text); }
      .qr-image { width: 240px; height: 240px; object-fit: contain; border-radius: 12px; border: 1px solid #313131; background: #fff; }
      @media (max-width: 720px) {
        .admin-shell { padding: 16px; }
        .hero { flex-direction: column; align-items: flex-start; gap: 6px; }
        .grid { grid-template-columns: 1fr; }
      }
    `
  ]
})
export class AdminDashboardComponent implements OnInit {
  private notificationsService = inject(NotificationsService);
  private analyticsService = inject(AnalyticsService);
  private cdr = inject(ChangeDetectorRef);

  dailyCode = this.buildDailyCode();
  qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(this.dailyCode)}`;
  unreadCount = 0;
  summary = { studentsActive: 0, checkInsToday: 0, pendingQuestions: 0 };
  ngOnInit(): void {
    this.refreshUnread();
    this.loadSummary();
  }

  refreshUnread() {
    this.notificationsService.getUnreadCount().subscribe((res) => {
      queueMicrotask(() => {
        this.unreadCount = res.count ?? 0;
        this.cdr.markForCheck();
      });
    });
  }

  loadSummary() {
    this.analyticsService.getSummary().subscribe((summary) => {
      queueMicrotask(() => {
        this.summary = summary;
        this.cdr.markForCheck();
      });
    });
  }

  private buildDailyCode() {
    const day = new Date().toISOString().slice(0, 10);
    return `SIGA-${day}`;
  }
}

