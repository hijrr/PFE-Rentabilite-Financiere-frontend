import { Component, Input, OnInit } from '@angular/core';
import { AuthService, UserOut } from 'src/app/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
 user?: UserOut;

  isDarkMode = false;
  showNotifications = false;
  showUserMenu = false;
  unreadNotifications = 3;

  notifications = [
    {
      id: 1,
      type: 'invoice',
      message: 'Nouvelle facture créée pour EnergyWay',
      time: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes
      read: false
    },
    {
      id: 2,
      type: 'client',
      message: 'Nouveau client : AMAYAS CONSULTING',
      time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 heures
      read: false
    },
    {
      id: 3,
      type: 'salarie',
      message: 'Thomas Martin a été ajouté',
      time: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 heures
      read: false
    },
    {
      id: 4,
      type: 'projet',
      message: 'Projet "Site E-commerce" terminé',
      time: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 jour
      read: true
    },
    {
      id: 5,
      type: 'alert',
      message: 'Facture FA-2024-0012 en retard de paiement',
      time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 jours
      read: true
    }
  ];
  constructor(private authService: AuthService) { }

  ngOnInit(): void {
     const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';
    this.applyTheme();
    this.authService.getCurrentUser().subscribe({
      next: (u) => this.user = u,
      error: (err) => console.log('Erreur fetching user', err)
    });
  }
getInitial(username: string): string {
  if (!username) return '';  // si username vide ou null
  return username.charAt(0).toUpperCase(); // première lettre en majuscule
}

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  applyTheme(): void {
    if (this.isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.unreadNotifications = 0;
  }
}
