import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
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
  private _notifications$ = new BehaviorSubject<Notification[]>([]);
  private _nonLues$ = new BehaviorSubject<number>(0);
  private _newToast$ = new Subject<Notification>();

  readonly notifications$ = this._notifications$.asObservable();
  readonly nonLues$ = this._nonLues$.asObservable();
  readonly newToast$ = this._newToast$.asObservable();

  private ws?: WebSocket;
  private wsReconnectTimer: any;

  constructor(private http: HttpClient) {
     this.loadAll();
    this.connectWS();
   }
   // ─────────────────────────────────────────────
  // GET ALL
  // ─────────────────────────────────────────────
  loadAll(): void {
    this.http.get<any>('http://localhost:8000/notifications')
      .subscribe({
        next: (res) => {
          this._notifications$.next(res.items || []);
          this._nonLues$.next(res.non_lues || 0);
        },
        error: (err) => console.error('loadAll error', err)
      });
  }

  // ─────────────────────────────────────────────
  // WEBSOCKET
  // ─────────────────────────────────────────────
  private connectWS(): void {

    this.ws = new WebSocket('ws://localhost:8000/notifications/ws');

    this.ws.onopen = () => console.log('WS connected');

    this.ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);

      if (payload.type === 'init') {

        const existing = this._notifications$.value;
        const ids = new Set(existing.map(n => n.id));

        const merged = [
          ...payload.notifications.filter((n: Notification) => !ids.has(n.id)),
          ...existing
        ];

        this._notifications$.next(merged);
        this._nonLues$.next(merged.filter(n => !n.lu).length);

      } else {

        const notif = payload as Notification;

        this._notifications$.next([notif, ...this._notifications$.value]);
        this._nonLues$.next(this._notifications$.value.filter(n => !n.lu).length);
        this._newToast$.next(notif);
      }
    };

    this.ws.onclose = () => {
      this.wsReconnectTimer = setTimeout(() => this.connectWS(), 5000);
    };

    this.ws.onerror = () => this.ws?.close();
  }

  // ─────────────────────────────────────────────
  // CHECK NOW
  // ─────────────────────────────────────────────
  checkNow(): Observable<any> {
    return this.http.post('http://localhost:8000/notifications/check', {});
  }

  // ─────────────────────────────────────────────
  // MARK READ
  // ─────────────────────────────────────────────
  markRead(id: string): void {
    this.http.patch(`http://localhost:8000/notifications/${id}/read`, {})
      .subscribe(() => {

        const updated = this._notifications$.value.map(n =>
          n.id === id ? { ...n, lu: true } : n
        );

        this._notifications$.next(updated);
        this._nonLues$.next(updated.filter(n => !n.lu).length);
      });
  }

  // ─────────────────────────────────────────────
  // MARK ALL READ
  // ─────────────────────────────────────────────
  markAllRead(): void {
    this.http.patch('http://localhost:8000/notifications/read-all', {})
      .subscribe(() => {

        const updated = this._notifications$.value.map(n => ({
          ...n,
          lu: true
        }));

        this._notifications$.next(updated);
        this._nonLues$.next(0);
      });
  }

  // ─────────────────────────────────────────────
  // CLEAR READ
  // ─────────────────────────────────────────────
  clearRead(): void {
    this.http.delete('http://localhost:8000/notifications/clear')
      .subscribe(() => {
        const updated = this._notifications$.value.filter(n => !n.lu);
        this._notifications$.next(updated);
      });
  }

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────
  getByProjet(projetId: number): Notification[] {
    return this._notifications$.value.filter(n => n.projet_id === projetId);
  }

  getNonLues(): Notification[] {
    return this._notifications$.value.filter(n => !n.lu);
  }

  // ─────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────
  ngOnDestroy(): void {
    this.ws?.close();
    clearTimeout(this.wsReconnectTimer);
  }
}
