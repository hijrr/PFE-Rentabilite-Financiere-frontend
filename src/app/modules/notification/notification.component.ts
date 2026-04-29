import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService } from 'src/app/services/notification.service';

interface Notification {
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

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit, OnDestroy {

  all: Notification[] = [];
  filtered: Notification[] = [];

  filterType: string = 'tous';
  filterNiveau: string = 'tous';
  filterLu: string = 'tous';

  expandedId: string | null = null;
  checking = false;

  private subs = new Subscription();

  constructor(public notifService: NotificationService) {}

  ngOnInit(): void {
    this.subs.add(
      this.notifService.notifications$.subscribe(list => {
        this.all = list;
        this.applyFilters();
      })
    );
  }

  applyFilters(): void {
    this.filtered = this.all.filter(n => {
      if (this.filterType !== 'tous' && n.type !== this.filterType) return false;
      if (this.filterNiveau !== 'tous' && n.niveau !== this.filterNiveau) return false;
      if (this.filterLu === 'non-lu' && n.lu) return false;
      if (this.filterLu === 'lu' && !n.lu) return false;
      return true;
    });
  }

  setFilter(field: string, val: string): void {
    (this as any)[field] = val;
    this.applyFilters();
  }

  get nonLuesCount(): number {
    return this.all.filter(n => !n.lu).length;
  }

  markRead(id: string): void {
    this.notifService.markRead(id);
  }

  markAllRead(): void {
    this.notifService.markAllRead();
  }

  clearRead(): void {
    this.notifService.clearRead();
  }

  toggleExpand(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  checkNow(): void {
    this.checking = true;
    this.notifService.checkNow().subscribe({
      next: () => this.checking = false,
      error: () => this.checking = false
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
