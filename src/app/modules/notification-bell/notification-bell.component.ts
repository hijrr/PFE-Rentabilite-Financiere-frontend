import { Component, HostListener, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from 'src/app/services/notification.service';

@Component({
  selector: 'app-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css']
})
export class NotificationBellComponent implements OnInit, OnDestroy {

  nonLues = 0;
  open = false;
  preview: Notification[] = [];

  private subs = new Subscription();

  constructor(
    public notifService: NotificationService,
    private router: Router,
    private elRef: ElementRef
  ) {}

  ngOnInit(): void {

    this.subs.add(
      this.notifService.nonLues$.subscribe(n => {
        this.nonLues = n;
      })
    );

    this.subs.add(
      this.notifService.notifications$.subscribe(list => {
        this.preview = (list || []).slice(0, 5);
      })
    );
  }

  toggle(): void {
    this.open = !this.open;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.open = false;
    }
  }

  goToAll(): void {
    this.open = false;
    this.router.navigate(['/notifications']);
  }

  markRead(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.notifService.markRead(id);
  }

  markAllRead(): void {
    this.notifService.markAllRead();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
