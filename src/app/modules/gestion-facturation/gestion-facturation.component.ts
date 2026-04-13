import { Component, OnInit } from '@angular/core';
import { ClientService } from 'src/app/services/client.service';

@Component({
  selector: 'app-gestion-facturation',
  templateUrl: './gestion-facturation.component.html',
  styleUrls: ['./gestion-facturation.component.css']
})
export class GestionFacturationComponent implements OnInit {
  invoices: any[] = [];
  filteredInvoices: any[] = [];
  clients: any[] = [];
  filteredClients: any[] = [];
  searchTerm: string = '';
  selectedClientId: string = '';

  // Autocomplete
  showClientList: boolean = false;
  hideTimeout: any;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;

  // Modal
  showDetailsModal: boolean = false;
  selectedInvoice: any = null;

  // Statistiques
  totalInvoices: number = 0;
  totalPaid: number = 0;
  totalUnpaid: number = 0;
  totalAmount: number = 0;
  totalPaidTTC: number = 0;
  isLoading: boolean = true;

  constructor(private clientService: ClientService) { }

  ngOnInit(): void {
    this.loadInvoices();
    this.loadClients();
  }

  loadInvoices(): void {
    this.isLoading = true;
    this.clientService.getInvoicesBD().subscribe({
      next: (data) => {
        this.invoices = data.invoices || [];
        // Trier par date de création (plus récent d'abord)
        this.invoices.sort((a, b) => (b.date_creation || 0) - (a.date_creation || 0));
        this.filteredInvoices = [...this.invoices];
        this.calculerStatistiques();
        this.updatePagination();
        this.isLoading = false;
        console.log('Factures chargées:', this.invoices);
      },
      error: (err) => {
        console.error('Erreur chargement factures:', err);
        this.isLoading = false;
      }
    });
  }

  loadClients(): void {
    this.clientService.getClients().subscribe({
      next: (data) => {
        this.clients = data.clients || [];
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
      },
      error: (err) => console.error('Erreur chargement clients:', err)
    });
  }

  calculerStatistiques(): void {
    this.totalInvoices = this.invoices.filter(inv => inv.statut !== "0").length;
    this.totalPaid = this.invoices.filter(inv => inv.paye === "1"&& inv.statut === "2").length;
    this.totalUnpaid = this.invoices.filter(inv => inv.paye === "0" && inv.statut === "1").length;
    this.totalAmount = this.invoices.filter(inv => inv.paye === "1" && inv.statut === "2")
    .reduce((sum, inv) => sum + parseFloat(inv.total_ht || "0"), 0);
    this.totalPaidTTC = this.invoices.filter(inv => inv.paye === "1" && inv.statut === "2")
    .reduce((sum, inv) => sum + parseFloat(inv.total_ttc || "0"), 0);
  }

  // ========== AUTOCOMPLETE CLIENTS ==========
  onSearchInput(event: any): void {
    this.searchTerm = event.target.value;
    this.showClientList = true;

    // Filtrer les clients
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      this.filteredClients = this.clients.filter(client =>
        client.name?.toLowerCase().includes(term) ||
        client.email?.toLowerCase().includes(term)
      );
    } else {
      this.filteredClients = [...this.clients];
    }
  }
   

  hideClientListWithDelay(): void {
    this.hideTimeout = setTimeout(() => {
      this.showClientList = false;
    }, 200);
  }

  selectClient(client: any): void {
    this.selectedClientId = client.id;
    this.searchTerm = client.name;
    this.showClientList = false;
    clearTimeout(this.hideTimeout);
    this.applyFilters();
  }

  resetClientFilter(): void {
    this.selectedClientId = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  getSelectedClientName(): string {
    const client = this.clients.find(c => c.id == this.selectedClientId);
    return client ? client.name : '';
  }

  // ========== FILTRAGE ==========
  applyFilters(): void {
    let filtered = this.invoices;

    // Filtre par client
    if (this.selectedClientId) {
      filtered = filtered.filter(inv => inv.socid == this.selectedClientId);
    }

    this.filteredInvoices = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  // ========== CLIENTS UTILS ==========
  getClientName(clientId: string): string {
    const client = this.clients.find(c => c.id == clientId);
    return client ? client.name : 'Client inconnu';
  }

  getClientCode(clientId: string): string {
    const client = this.clients.find(c => c.id == clientId);
    return client ? client.code_client : '—';
  }

  getClientLogo(clientId: string): string {
    const client = this.clients.find(c => c.id == clientId);
    return client ? client.logoData : '';
  }

  getClientInitials(client: any): string {
    if (!client || !client.name) return '?';
    const nameParts = client.name.split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
    }
    return client.name.charAt(0).toUpperCase();
  }

  getClientInitialsById(clientId: string): string {
    const client = this.clients.find(c => c.id == clientId);
    return this.getClientInitials(client);
  }

  getClientNameById(clientId: string): string {
    const client = this.clients.find(c => c.id == clientId);
    return client ? client.name : '';
  }
  getClientById(clientId: string): any {
    return this.clients.find(c => c.id == clientId) || null;
  }
  getClientEmail(clientId: string): string {
    const client = this.clients.find(c => c.id == clientId);
    return client ? client.email : '';
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

  // Formatage des montants avec 2 décimales
  formatMontant(montant: string | number): string {
    const num = typeof montant === 'string' ? parseFloat(montant) : montant;
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num || 0);
  }
getCATtcImpayee(): number {
  return this.invoices
    .filter(inv => inv.paye === "0" && inv.statut === "1")
    .reduce((sum, inv) => sum + parseFloat(inv.total_ttc || "0"), 0);
}
  // Statut facture
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

  // Pagination
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredInvoices.length / this.itemsPerPage);
  }

  get paginatedInvoices(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredInvoices.slice(start, end);
  }

  getPaginationStart(): number {
    return this.filteredInvoices.length > 0 ? (this.currentPage - 1) * this.itemsPerPage + 1 : 0;
  }

  getPaginationEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredInvoices.length);
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
// Générer la classe CSS d'avatar optimisée
  getAvatarClass(client: any): string {
    if (!client || !client.name) {
      return 'avatar-default';
    }

    const firstLetter = client.name.charAt(0).toUpperCase();
    return `avatar-${firstLetter.toLowerCase()}`;
  }

  onPageClick(page: number | string): void {
    if (typeof page === 'number') {
      this.changePage(page);
    }
  }

  // Modal actions
  openInvoiceDetails(invoice: any): void {
    this.selectedInvoice = invoice;
    this.showDetailsModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.showDetailsModal = false;
    this.selectedInvoice = null;
    document.body.style.overflow = 'auto';
  }

  downloadInvoice(invoice: any): void {
    console.log('Téléchargement facture:', invoice.ref);
    if (invoice.online_payment_url) {
      window.open(invoice.online_payment_url, '_blank');
    }
  }
}
