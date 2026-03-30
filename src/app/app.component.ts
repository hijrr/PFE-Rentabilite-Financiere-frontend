import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  isLoggedIn = false;
  constructor(private router: Router,private authService: AuthService) {
     this.authService.isLoggedIn$.subscribe(status => this.isLoggedIn = status);
  }
  title = 'rentabilite-dashboard';
  // Variable pour suivre l'état de la sidebar
  isSidebarCollapsed = false;

  // Méthode appelée quand la sidebar change d'état
  onSidebarToggle(collapsed: boolean) {
    this.isSidebarCollapsed = collapsed;
    console.log('Sidebar état:', collapsed ? 'réduite' : 'ouverte');
  }
  isLoginPage(): boolean {
    return !this.isLoggedIn;
}
}
