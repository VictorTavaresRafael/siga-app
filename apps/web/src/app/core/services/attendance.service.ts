import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AttendanceService {
    getFrequencyData(): Observable<any> {
        return this.http.get<any[]>(`${this.API_URL}/analytics/frequency`).pipe(
            map(data => ({
                labels: data.map(d => d.day), // Ex: ['Seg', 'Ter', 'Qua'...]
                datasets: [
                    {
                        data: data.map(d => d.count),
                        label: 'Frequência Diária',
                        backgroundColor: '#3f51b5',
                        borderColor: '#3f51b5',
                        fill: false
                    }
                ]
            }))
        );
    }
    private http = inject(HttpClient);
    private readonly API_URL = `${environment.apiUrl}/attendance`;

    // Envia o QR Code do dia para o backend
    registerCheckIn(qrCode: string): Observable<any> {
        return this.http.post(`${this.API_URL}/check-in`, { qrCode });
    }

    // Verifica se o aluno já realizou check-in hoje
    hasCheckInToday(): Observable<{ checkedIn: boolean }> {
        return this.http.get<{ checkedIn: boolean }>(`${this.API_URL}/me/today`);
    }

    exportAttendance(): Observable<Blob> {
        return this.http.get(`${environment.apiUrl}/analytics/export`, { responseType: 'blob' });
    }
}
