import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dasboard',
  templateUrl: './dasboard.component.html',
  styleUrls: ['./dasboard.component.css']
})
export class DasboardComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }
  // État du menu (ouvert/réduit)
  isCollapsed = false;

  // Élément actif
  activeItem: string = 'accueil';

  // Données utilisateur
  user = {
    name: 'Thomas Martin',
    email: 'thomas.martin@elzei.fr',
    initials: 'TM'
  };

  setActive(itemId: string) {
    this.activeItem = itemId;
  }

  toggleMenu() {
    this.isCollapsed = !this.isCollapsed;
  }

  logout() {
    console.log('Déconnexion...');
  }
}
