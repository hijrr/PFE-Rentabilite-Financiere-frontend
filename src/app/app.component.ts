import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(private router: Router) {}
  title = 'rentabilite-dashboard';
  // Variable pour suivre l'état de la sidebar
  isSidebarCollapsed = false;

  // Méthode appelée quand la sidebar change d'état
  onSidebarToggle(collapsed: boolean) {
    this.isSidebarCollapsed = collapsed;
    console.log('Sidebar état:', collapsed ? 'réduite' : 'ouverte');
  }
  isLoginPage(): boolean {
  return this.router.url === '/login';
}
}
