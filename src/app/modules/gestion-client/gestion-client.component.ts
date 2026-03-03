
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ClientService } from 'src/app/services/client.service';

@Component({
  selector: 'app-gestion-client',
  templateUrl: './gestion-client.component.html',
  styleUrls: ['./gestion-client.component.css']
})
export class GestionClientComponent implements OnInit {
 clients: any[] = [];
  filteredClients: any[] = [];
  searchTerm: string = '';

  // KPI - À COMPLÉTER
  totalClients: number = 0;
  clientsActifs: number = 0;
  totalProspects: number = 0;
  clientTrend: number = 5;        // À calculer
  actifsTrend: number = 3;         // À calculer
  prospectsTrend: number = -2;     // À calculer

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 7;
  totalPages: number = 1;


  constructor(private clientService: ClientService) { }

  ngOnInit(): void {
      this.loadClients();
  }

    loadClients(): void {
    this.clientService.getClients().subscribe({
      next: (data) => {
        this.clients = data.clients || [];

        // Calcul des KPI
        this.totalClients = this.clients.length;
        this.clientsActifs = this.clients.filter(c => c.client === '1').length;
        this.totalProspects = this.clients.filter(c => c.client === '2').length;

        // Chargement des logos
        this.clients.forEach(client => {
          if (client.logo && client.id) {
            const filePath = `${client.id}/logos/${client.logo}`;
            this.clientService.getClientLogo('societe', filePath)
              .subscribe({
                next: (res) => {
                  client.logoData = `data:${res.content_type};base64,${res.base64}`;
                },
                error: (err) => console.error("Erreur logo :", err)
              });
          }
        });

        this.filteredClients = [...this.clients];
        this.updatePagination();
      },
      error: (err) => console.error('Erreur récupération clients', err)
    });
  }

  // Filtrage
  filterClients(event: any): void {
    const term = event.target.value.toLowerCase();
    this.searchTerm = term;

    if (!term) {
      this.filteredClients = this.clients;
    } else {
      this.filteredClients = this.clients.filter(client =>
        client.name?.toLowerCase().includes(term) ||
        client.email?.toLowerCase().includes(term) ||
        client.code_client?.toLowerCase().includes(term) ||
        client.phone?.includes(term) ||
        client.town?.toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  // Pagination
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredClients.length / this.itemsPerPage);
  }

  get paginatedClients(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredClients.slice(start, end);
  }

  getPaginationStart(): number {
    return this.filteredClients.length > 0 ? (this.currentPage - 1) * this.itemsPerPage + 1 : 0;
  }

  getPaginationEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredClients.length);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Utilitaires
  formatPhone(phone: string): string {
    if (!phone) return '—';
    return phone;
  }

  getCountryName(countryCode: string): string {
    const countries: {[key: string]: string} = {
      'FR': 'France',
      'GB': 'Royaume-Uni',
      'US': 'États-Unis',
      'DE': 'Allemagne',
      'ES': 'Espagne',
      'IT': 'Italie'
    };
    return countries[countryCode] || countryCode || '—';
  }

  getClientStatus(clientType: string): {label: string, class: string} {
    switch(clientType) {
      case '1':
        return {label: 'Client', class: 'status-client'};
      case '2':
        return {label: 'Prospect', class: 'status-prospect'};
      default:
        return {label: 'Autre', class: 'status-other'};
    }
  }

  // Actions
  openClientDetails(client: any): void {
    console.log('Détails du client:', client);
    // Implémenter l'ouverture du modal
  }
  isSidebarCollapsed = false;
  // Méthode appelée quand la sidebar change d'état
  onSidebarToggle(collapsed: boolean) {
    this.isSidebarCollapsed = collapsed;
    console.log('Sidebar état:', collapsed ? 'réduite' : 'ouverte');
  }
}

