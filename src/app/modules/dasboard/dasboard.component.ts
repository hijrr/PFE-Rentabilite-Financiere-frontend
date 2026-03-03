import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { AuthService, UserOut } from 'src/app/services/auth.service';

@Component({
  selector: 'app-dasboard',
  templateUrl: './dasboard.component.html',
  styleUrls: ['./dasboard.component.css']
})
export class DasboardComponent implements OnInit {
 user?: UserOut;
  constructor(public  authService: AuthService) { }

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
  // État du menu (ouvert/réduit)
  isCollapsed = false;

  // Élément actif
  activeItem: string = 'accueil';



    @Output() toggleChange = new EventEmitter<boolean>();

  setActive(itemId: string) {
    this.activeItem = itemId;
  }

  toggleMenu() {
    this.isCollapsed = !this.isCollapsed;
     this.toggleChange.emit(this.isCollapsed);
  }

  logout() {
    console.log('Déconnexion...');
  }
}
