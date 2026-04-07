import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService, UserOut } from 'src/app/services/auth.service';

@Component({
  selector: 'app-dasboard',
  templateUrl: './dasboard.component.html',
  styleUrls: ['./dasboard.component.css']
})
export class DasboardComponent implements OnInit {
 user?: UserOut;
  constructor(public  authService: AuthService,private router: Router) { }

  ngOnInit(): void {
     this.authService.getCurrentUser().subscribe({
      next: (u) => this.user = u,
      error: (err) => console.log('Erreur fetching user', err)
    });
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const routeSegment = event.urlAfterRedirects.split('/')[1];
        this.activeItem = this.mapRouteToActive(routeSegment);
      }
    });
  }
   mapRouteToActive(segment: string): string {
    switch(segment.toLowerCase()) {
      case 'facturation': return 'Facturation';
      case 'clients': return 'Clients';
      case 'salaries': return 'salaries';
      case 'calcul': return 'calcul';
      case 'projets': return 'projets';
      case 'historique': return 'historique';
      case 'parametres':return 'parametres'
      case 'calculpargroupe': return 'calculParGroupe';
      case'calculparsalaire': return 'calculparsalaire';
      default: return 'accueil';
    }
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


}
