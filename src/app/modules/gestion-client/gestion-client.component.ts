import { Component, OnInit } from '@angular/core';
import { ClientService } from 'src/app/services/client.service';

@Component({
  selector: 'app-gestion-client',
  templateUrl: './gestion-client.component.html',
  styleUrls: ['./gestion-client.component.css']
})
export class GestionClientComponent implements OnInit {
  clients: any[] = [];
  invoices: any[] = [];
  filteredClients: any[] = [];
  searchTerm: string = '';
  showClientList: boolean = false;
selectedClientId: string | null = null;
filteredClientsList: any[] = [];
private hideTimeout: any;
  // KPI Clients
  totalClients: number = 0;
  clientsActifs: number = 0;
  totalProspects: number = 0;
  clientTrend: number = 5;
  actifsTrend: number = 3;
  prospectsTrend: number = -2;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 7;
  totalPages: number = 1;

  // Cache pour les CA par client
  caByClient: any = {};

  // Modal
  showDetailsModal: boolean = false;
  selectedClient: any = null;
 isLoading: boolean = false; // Indicateur de chargement

  constructor(private clientService: ClientService) { }

  ngOnInit(): void {
    this.loadClients();
    this.loadInvoices();
  }
  onSearchInput(event: any): void {
  const term = event.target.value.toLowerCase();
  this.searchTerm = term;

  if (term) {
    this.filteredClientsList = this.clients.filter(client =>
      client.name?.toLowerCase().includes(term) ||
      client.email?.toLowerCase().includes(term) ||
      client.code_client?.toLowerCase().includes(term) ||
      client.phone?.includes(term) ||
      client.town?.toLowerCase().includes(term)
    );
  } else {
    this.filteredClientsList = this.clients.slice(0, 5);
  }

  this.showClientList = true;
}

selectClient(client: any): void {
  this.selectedClientId = client.id;
  this.searchTerm = client.name;
  this.filteredClients = [client];
  this.currentPage = 1;
  this.updatePagination();
  this.showClientList = false;
}

resetClientFilter(): void {
  this.selectedClientId = null;
  this.searchTerm = '';
  this.filteredClients = [...this.clients];
  this.currentPage = 1;
  this.updatePagination();
}

getSelectedClientName(): string {
  if (!this.selectedClientId) return '';
  const client = this.clients.find(c => c.id == this.selectedClientId);
  return client ? client.name : '';
}

hideClientListWithDelay(): void {
  this.hideTimeout = setTimeout(() => {
    this.showClientList = false;
  }, 200);
}

getClientInitials(client: any): string {
  if (!client.name) return '?';
  return client.name.charAt(0).toUpperCase();
}

  // Chargement des clients
  loadClients(): void {

    this.clientService.getclientsBD().subscribe({
      next: (data) => {
        this.clients = data.clients || [];
  this.filteredClientsList = [...this.clients];
        // Calcul des KPI clients
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

  // Chargement des factures
  loadInvoices(): void {
    this.isLoading = true;
    this.clientService.getInvoicesBD().subscribe({
      next: (data) => {
       this.invoices = data.invoices || [];

        // Calculer le CA par client après chargement des factures
        this.caByClient = this.getCAByClient();
this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
  getCAByClient(): any {
  const result: any = {};

  this.invoices.forEach(inv => {
    if (inv.paye !== "1") return;

    const clientId = inv.socid;

    if (!result[clientId]) {
      result[clientId] = 0;
    }

    result[clientId] += Number(inv.total_ttc || 0);
  });

  return result;
}

  getClientCA(clientId: string): number {
    return this.caByClient[clientId] || 0;
  }

  getClientInvoiceCount(clientId: string): number {
    return this.invoices.filter(inv => inv.socid == clientId).length;
  }


  getClientInvoices(clientId: string): any[] {
    return this.invoices.filter(inv => inv.socid == clientId);
  }

  // Formatage de date
  formatDate(timestamp: number): string {
    if (!timestamp) return '—';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getInvoiceStatusClass(invoice: any): string {

  if (invoice.paye === "1") {
    return 'status-paid';
  }

  if (invoice.statut === "1") {
    return 'status-pending';
  }

  return 'status-draft';
}

 getInvoiceStatusLabel(invoice: any): string {

  if (invoice.paye === "1") {
    return 'Payée';
  }

  if (invoice.statut === "1") {
    return 'En attente';
  }

  return 'Brouillon';
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

  get pageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 2; // Nombre de pages autour de la page courante

    if (total <= 7) {
      // Si moins de 7 pages, afficher toutes
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Toujours afficher la première page
      pages.push(1);

      // Calculer la plage autour de la page courante
      let start = Math.max(2, current - delta);
      let end = Math.min(total - 1, current + delta);

      // Ajouter ellipse si nécessaire avant la plage
      if (start > 2) {
        pages.push('...');
      }

      // Ajouter les pages de la plage
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Ajouter ellipse si nécessaire après la plage
      if (end < total - 1) {
        pages.push('...');
      }

      // Toujours afficher la dernière page
      if (total > 1) {
        pages.push(total);
      }
    }

    return pages;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onPageClick(page: number | string): void {
    if (typeof page === 'number') {
      this.changePage(page);
    }
  }

  // Utilitaires
  formatPhone(phone: string): string {
    if (!phone) return '—';
    // Format: XX XX XX XX XX (si c'est un numéro français)
    if (phone.length === 10) {
      return phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    return phone;
  }

  getCountryName(countryCode: string): string {
    const countries: {[key: string]: string} = {
      'FR': 'France',
      'GB': 'Royaume-Uni',
      'US': 'États-Unis',
      'DE': 'Allemagne',
      'ES': 'Espagne',
      'IT': 'Italie',
      'BE': 'Belgique',
      'CH': 'Suisse',
      'LU': 'Luxembourg',
      'CA': 'Canada'
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

  openClientDetails(client: any): void {
  console.log('Ouverture modal pour:', client); // Ajoutez ce log pour vérifier
  this.selectedClient = client;
  this.showDetailsModal = true;
  document.body.style.overflow = 'hidden'; // Empêcher le scroll
  console.log('showDetailsModal:', this.showDetailsModal); // Vérifiez que ça devient true
}

 closeModal(): void {
  this.showDetailsModal = false;
  document.body.style.overflow = 'auto'; // Réactiver le scroll
  this.selectedClient = null;
  console.log('Modal fermé');
}
  isSidebarCollapsed = false;

  onSidebarToggle(collapsed: boolean) {
    this.isSidebarCollapsed = collapsed;
  }
  // Générer la classe CSS d'avatar optimisée
  getAvatarClass(client: any): string {
    if (!client || !client.name) {
      return 'avatar-default';
    }

    const firstLetter = client.name.charAt(0).toUpperCase();
    return `avatar-${firstLetter.toLowerCase()}`;
  }
}
