import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from 'src/app/services/notification.service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit, OnDestroy {

  all: Notification[] = [];
  filtered: Notification[] = [];

  filterType = 'tous';
  filterNiveau = 'tous';
  filterLu = 'tous';

  expandedId: string | null = null;

  private subscription = new Subscription();

  constructor(public notifService: NotificationService) {}

  ngOnInit(): void {
    // S'abonner aux notifications du service
    this.subscription.add(
      this.notifService.notifications$.subscribe(list => {
        this.all = list ?? [];
        this.applyFilters();
      })
    );
  }

  applyFilters(): void {
    this.filtered = this.all.filter(n => {
      // Filtre par type
      if (this.filterType !== 'tous' && n.type !== this.filterType) return false;
      // Filtre par niveau
      if (this.filterNiveau !== 'tous' && n.niveau !== this.filterNiveau) return false;
      // Filtre par statut (lu / non lu)
      if (this.filterLu === 'lu' && !n.lu) return false;
      if (this.filterLu === 'non-lu' && n.lu) return false;
      return true;
    });
  }

  setFilter(field: 'filterType' | 'filterNiveau' | 'filterLu', value: string): void {
    this[field] = value;
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

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
