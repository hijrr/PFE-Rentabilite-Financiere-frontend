import { Component, OnInit, ViewChild } from '@angular/core';
import { DasboardComponent } from '../dasboard/dasboard.component';
import { AuthService, UserOut } from 'src/app/services/auth.service';

@Component({
  selector: 'app-calcul-ren-main',
  templateUrl: './calcul-ren-main.component.html',
  styleUrls: ['./calcul-ren-main.component.css']
})
export class CalculRenMainComponent implements OnInit {
 user?: UserOut;
  constructor(private authService: AuthService) { }

  ngOnInit(): void {
     this.authService.getCurrentUser().subscribe({
      next: (u) => this.user = u,
      error: (err) => console.log('Erreur fetching user', err)
    });
  }
   getInitial(username: string): string {
  if (!username) return '';  // si username vide ou null
  return username.charAt(0).toUpperCase(); // première lettre en majuscule
}
// Variable pour suivre l'état de la sidebar
  isSidebarCollapsed = false;

  // Méthode appelée quand la sidebar change d'état
  onSidebarToggle(collapsed: boolean) {
    this.isSidebarCollapsed = collapsed;
    console.log('Sidebar état:', collapsed ? 'réduite' : 'ouverte');
  }
}
