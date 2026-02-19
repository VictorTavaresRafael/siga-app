import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AttendanceService } from '../../../core/services/attendance.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-check-in',
  standalone: true,
  imports: [CommonModule, ZXingScannerModule, MatButtonModule, MatCardModule],
  template: `
    <div class="scan-shell">
      <mat-card class="scan-card">
        <mat-card-header>
          <mat-card-title>Registro de Presenca</mat-card-title>
          <mat-card-subtitle>Aponte a camera para o QR Code do dia</mat-card-subtitle>
        </mat-card-header>

        <zxing-scanner
          (scanSuccess)="onCodeResult($event)"
          [enable]="scannerEnabled">
        </zxing-scanner>

        <mat-card-footer *ngIf="message">
          <p class="feedback">{{ message }}</p>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [`
    .scan-shell { display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 64px); padding: 24px; }
    .scan-card { width: 100%; max-width: 560px; text-align: center; padding-bottom: 12px; border-radius: 18px; border: 1px solid rgba(225, 6, 0, 0.42); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.38); }
    zxing-scanner { width: 100%; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35); border: 1px solid #2c2c2c; }
    .feedback { padding: 10px; color: #93c5fd; font-weight: 700; }
  `]
})
export class CheckInComponent {
  private attendanceService = inject(AttendanceService);
  private router = inject(Router);
  scannerEnabled = true;
  message = '';

  onCodeResult(resultString: string) {
    this.scannerEnabled = false; // Pausa o scanner apos ler
    this.message = 'Processando presenca...';

    this.attendanceService.registerCheckIn(resultString).subscribe({
      next: (res) => {
        if (res?.alreadyCheckedIn) {
          this.message = 'Voce ja registrou presenca hoje.';
          setTimeout(() => this.router.navigate(['/dashboard']), 800);
          return;
        }
        this.message = 'Presenca registrada com sucesso!';
        setTimeout(() => this.router.navigate(['/dashboard']), 800);
      },
      error: (err) => {
        this.message = 'Erro: ' + (err.error?.message || 'Falha na conexao');
        this.scannerEnabled = true; // Reativa se der erro
      }
    });
  }
}
