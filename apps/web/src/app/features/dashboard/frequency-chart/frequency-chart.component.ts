import { Component, DestroyRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { switchMap, map, startWith } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-frequency-chart',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  providers: [provideCharts(withDefaultRegisterables())],
  template: `
    <mat-card class="chart-card">
      <mat-card-header>
        <mat-card-title>Indicadores</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="filters">
          <mat-form-field appearance="outline" class="filter">
            <mat-label>Tipo</mat-label>
            <mat-select [formControl]="typeControl">
              <mat-option value="freq_daily">Frequencia diaria</mat-option>
              <mat-option value="freq_gender">Frequencia por genero</mat-option>
              <mat-option value="freq_age">Frequencia por faixa etaria</mat-option>
              <mat-option value="summary_gender">Resumo por genero</mat-option>
              <mat-option value="summary_age">Resumo por faixa etaria</mat-option>
              <mat-option value="gender_age">Genero x faixa etaria</mat-option>
              <mat-option value="hourly_peak">Pico por horario</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter" *ngIf="showPeriodControls">
            <mat-label>Periodo</mat-label>
            <mat-select [formControl]="daysControl">
              <mat-option [value]="7">7 dias</mat-option>
              <mat-option [value]="14">14 dias</mat-option>
              <mat-option [value]="30">30 dias</mat-option>
              <mat-option [value]="90">90 dias</mat-option>
              <mat-option [value]="180">180 dias</mat-option>
              <mat-option [value]="365">365 dias</mat-option>
              <mat-option value="custom">Personalizado</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter" *ngIf="showCustomRange">
            <mat-label>Inicio</mat-label>
            <input matInput type="date" [formControl]="startControl" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter" *ngIf="showCustomRange">
            <mat-label>Fim</mat-label>
            <input matInput type="date" [formControl]="endControl" />
          </mat-form-field>

          <div class="export-actions">
            <button mat-stroked-button color="primary" type="button" class="export-btn" (click)="exportPdf()">Exportar PDF</button>
            <button mat-stroked-button color="primary" type="button" class="export-btn" (click)="exportCsv()">Download CSV</button>
          </div>
        </div>

        <div class="chart-container">
          <canvas baseChart
            *ngIf="chartData$ | async as chartData"
            [data]="chartData"
            [options]="chartOptions"
            [type]="chartType">
          </canvas>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `.chart-card { margin-top: 0; padding: 10px 6px 4px; border-radius: 12px; border: none; box-shadow: none; background: transparent !important; }
     .chart-container { height: 280px; }
     .filters { display: grid; grid-template-columns: 1fr; gap: 8px; align-items: end; }
     .filter { width: 100%; margin-bottom: 0; }
     .export-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; }
     .export-btn { min-width: 0; width: 100%; }
     @media (min-width: 721px) {
       .chart-container { height: 320px; }
       .filters { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
       .filter { width: 200px; margin-bottom: 12px; }
       .export-actions { display: flex; width: auto; margin-left: auto; }
       .export-btn { min-width: 138px; width: auto; }
     }`
  ]
})
export class FrequencyChartComponent {
  private analyticsService = inject(AnalyticsService);
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  typeControl = new FormControl<
    | 'freq_daily'
    | 'freq_gender'
    | 'freq_age'
    | 'summary_gender'
    | 'summary_age'
    | 'gender_age'
    | 'hourly_peak'
  >('freq_daily', { nonNullable: true });

  daysControl = new FormControl<7 | 14 | 30 | 90 | 180 | 365 | 'custom'>(7, { nonNullable: true });
  startControl = new FormControl<string>('');
  endControl = new FormControl<string>('');

  chartType: 'line' | 'bar' = 'line';

  get showPeriodControls() {
    return true;
  }

  get showCustomRange() {
    return this.daysControl.value === 'custom';
  }

  chartData$ = this.typeControl.valueChanges.pipe(
    startWith(this.typeControl.value),
    switchMap((type) => this.buildChartData(type))
  );

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: { color: '#f3f4f6', font: { weight: 'bold' as const } },
      },
    },
    scales: {
      x: {
        ticks: { color: '#d1d5db' },
        grid: { color: 'rgba(255, 255, 255, 0.08)' },
      },
      y: {
        ticks: { color: '#d1d5db' },
        grid: { color: 'rgba(255, 255, 255, 0.08)' },
      },
    },
  };

  constructor() {
    this.typeControl.valueChanges
      .pipe(startWith(this.typeControl.value), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((type) => {
        this.chartType = type.startsWith('summary') || type === 'gender_age' || type === 'hourly_peak' ? 'bar' : 'line';
      });
  }

  private buildChartData(type: string) {
    return this.daysControl.valueChanges.pipe(
      startWith(this.daysControl.value),
      switchMap((days) => {
        const start = this.startControl.value || undefined;
        const end = this.endControl.value || undefined;
        const params = days === 'custom' && start && end ? { start, end } : { days: typeof days === 'number' ? days : 7 };
        return this.analyticsService.getSeries(type as any, params).pipe(
          map((data) => this.mapToChart(type, data))
        );
      })
    );
  }

  private mapToChart(type: string, data: any[]) {
    if (type === 'freq_daily') {
      return {
        labels: data.map((d) => d.day),
        datasets: [
          {
            data: data.map((d) => d.count),
            label: 'Frequencia diaria',
            backgroundColor: '#e10600',
            borderColor: '#e10600',
            fill: false,
          },
        ],
      };
    }

    if (type === 'freq_gender') {
      const genders = ['Masculino', 'Feminino', 'Outro', 'Prefiro nao dizer'];
      const days = Array.from(new Set(data.map((d) => d.day)));
      return {
        labels: days,
        datasets: genders.map((gender) => ({
          label: gender,
          data: days.map((day) => (data.find((d) => d.day === day && d.gender === gender)?.count ?? 0)),
          backgroundColor: this.colorForLabel(gender),
          borderColor: this.colorForLabel(gender),
          fill: false,
        })),
      };
    }

    if (type === 'freq_age') {
      const ranges = Array.from(new Set(data.map((d) => d.ageRange)));
      const days = Array.from(new Set(data.map((d) => d.day)));
      return {
        labels: days,
        datasets: ranges.map((range) => ({
          label: range,
          data: days.map((day) => (data.find((d) => d.day === day && d.ageRange === range)?.count ?? 0)),
          backgroundColor: '#f97316',
          borderColor: '#f97316',
          fill: false,
        })),
      };
    }

    if (type === 'summary_gender') {
      return {
        labels: data.map((d) => d.gender),
        datasets: [
          {
            data: data.map((d) => d.count),
            label: 'Resumo por genero',
            backgroundColor: '#f97316',
            borderColor: '#f97316',
          },
        ],
      };
    }

    if (type === 'summary_age') {
      return {
        labels: data.map((d) => d.ageRange),
        datasets: [
          {
            data: data.map((d) => d.count),
            label: 'Resumo por faixa etaria',
            backgroundColor: '#e10600',
            borderColor: '#e10600',
          },
        ],
      };
    }

    if (type === 'gender_age') {
      const genders = Array.from(new Set(data.map((d) => d.gender)));
      const ranges = Array.from(new Set(data.map((d) => d.ageRange)));
      return {
        labels: ranges,
        datasets: genders.map((gender) => ({
          label: gender,
          data: ranges.map((range) => (data.find((d) => d.gender === gender && d.ageRange === range)?.count ?? 0)),
          backgroundColor: this.colorForLabel(gender),
          borderColor: this.colorForLabel(gender),
        })),
      };
    }

    if (type === 'hourly_peak') {
      return {
        labels: data.map((d) => `${d.hour}h`),
        datasets: [
          {
            data: data.map((d) => d.count),
            label: 'Pico por horario',
            backgroundColor: '#f59e0b',
            borderColor: '#f59e0b',
          },
        ],
      };
    }

    return { labels: [], datasets: [] };
  }

  private colorForLabel(label: string) {
    if (label === 'Masculino') return '#ef4444';
    if (label === 'Feminino') return '#fb7185';
    if (label === 'Outro') return '#f59e0b';
    return '#9ca3af';
  }

  exportPdf() {
    const chartInstance = this.chart?.chart;
    if (!chartInstance) return;
    const img = chartInstance.toBase64Image();
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 24;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = pageHeight - margin * 2;
    pdf.addImage(img, 'PNG', margin, margin, imgWidth, imgHeight);
    pdf.save('grafico.pdf');
  }

  exportCsv() {
    const type = this.typeControl.value;
    const days = this.daysControl.value;
    const start = this.startControl.value || undefined;
    const end = this.endControl.value || undefined;
    const params =
      days === 'custom' && start && end
        ? { start, end }
        : { days: typeof days === 'number' ? days : 7 };

    this.analyticsService.exportCsv(type, params).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const today = new Date().toISOString().slice(0, 10);
      const suffix =
        days === 'custom' && start && end
          ? `${start}_${end}`
          : `${typeof days === 'number' ? days : 7}d`;
      anchor.download = `${type}-${suffix}-${today}.csv`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    });
  }
}

