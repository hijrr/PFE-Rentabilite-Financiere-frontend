import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface Notification {
  id: string;
  type: 'alerte' | 'recommandation' | 'info';
  niveau: 'danger' | 'warning' | 'info';
  titre: string;
  message: string;
  recommandation?: string;
  projet_id?: number;
  projet_nom?: string;
  lu: boolean;
  date: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private API = 'http://localhost:8000/notifications';

  private _notifications = new BehaviorSubject<Notification[]>([]);
  notifications$ = this._notifications.asObservable();

  private _nonLues = new BehaviorSubject<number>(0);
  nonLues$ = this._nonLues.asObservable();

  private socket?: WebSocket;

  constructor(private http: HttpClient) {
    this.loadInitial();
    this.connectWebSocket();
  }

  loadInitial() {
    this.http.get<any>(this.API).subscribe(res => {
      const items = res.items ?? [];
      this._notifications.next(items);
      this.updateCount(items);
    });
  }

  connectWebSocket() {
    try {
      this.socket = new WebSocket('ws://localhost:8000/notifications/ws');

      this.socket.onmessage = (event) => {
        try {
          const notif: Notification = JSON.parse(event.data);
          const current = this._notifications.value;
          if (!current.some(n => n.id === notif.id)) {
            const updated = [notif, ...current];
            this._notifications.next(updated);
            this.updateCount(updated);
          }
        } catch (e) {
          console.error('WS parse error', e);
        }
      };

      this.socket.onclose = () => {
        setTimeout(() => this.connectWebSocket(), 3000);
      };

    } catch (e) {
      console.error('WS error', e);
    }
  }

  updateCount(list: Notification[]) {
    this._nonLues.next(list.filter(n => !n.lu).length);
  }

  markRead(id: string) {
    this.http.patch(`${this.API}/${id}/read`, {}).subscribe(() => {
      const updated = this._notifications.value.map(n =>
        n.id === id ? { ...n, lu: true } : n
      );
      this._notifications.next(updated);
      this.updateCount(updated);
    });
  }

  // ✅ Correction : marquer toutes les notifications non lues sur le serveur
  markAllRead() {
    const nonLues = this._notifications.value.filter(n => !n.lu);
    if (nonLues.length === 0) return;

    // Envoyer une requête pour chaque notification non lue
    // Note : on pourrait aussi créer un endpoint dédié, mais c'est acceptable
    const promises = nonLues.map(n =>
      firstValueFrom(this.http.patch(`${this.API}/${n.id}/read`, {}))
    );

    Promise.all(promises).then(() => {
      const updated = this._notifications.value.map(n => ({ ...n, lu: true }));
      this._notifications.next(updated);
      this.updateCount(updated);
    }).catch(err => console.error('Erreur markAllRead', err));
  }

  clearRead() {
    this.http.delete(`${this.API}/clear`).subscribe(() => {
      const updated = this._notifications.value.filter(n => !n.lu);
      this._notifications.next(updated);
      this.updateCount(updated);
    });
  }

  checkNow() {
    return this.http.post(`${this.API}/check`, {});
  }
}
