import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationItem {
  id: string;
  type: string;
  content: string;
  read: boolean;
  response?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/notifications`;

  createNotification(payload: { type: string; content: string }): Observable<any> {
    return this.http.post(this.API_URL, payload);
  }

  getNotifications(unread = false): Observable<NotificationItem[]> {
    const query = unread ? '?unread=true' : '';
    return this.http.get<NotificationItem[]>(`${this.API_URL}${query}`);
  }

  getMyNotifications(): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>(`${this.API_URL}/me`);
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.API_URL}/unread-count`);
  }

  markRead(id: string): Observable<any> {
    return this.http.patch(`${this.API_URL}/${id}/read`, {});
  }

  reply(id: string, response: string): Observable<any> {
    return this.http.patch(`${this.API_URL}/${id}/reply`, { response });
  }
}
