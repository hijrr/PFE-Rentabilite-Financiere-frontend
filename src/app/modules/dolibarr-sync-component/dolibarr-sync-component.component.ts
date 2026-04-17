import { Component, OnInit } from '@angular/core';
import { Projet, ProjetService } from 'src/app/services/projet.service';
import { ClientService } from 'src/app/services/client.service';
import { FinanceDataService } from 'src/app/services/finance-data.service';

@Component({
  selector: 'app-dolibarr-sync-component',
  templateUrl: './dolibarr-sync-component.component.html',
  styleUrls: ['./dolibarr-sync-component.component.css']
})
export class DolibarrSyncComponentComponent implements OnInit {
  invoices: any[] = [];
  projets: any[] = [];
  clients: any[] = [];
  projetselectionner: any = null;
  selectedProjet: number | null = null;
  selectedDate: string = '';
  selectedFacture: number | null = null;
  extractedData: any = { tjm: null, jours_travailles: null, paye: null,salarie_id:null,date:null };
  filteredFactures: any[] = [];
searchProjetTerm: string = '';
filteredProjets: any[] = [];
selectedProjetObj: any = null;
  isSyncing: boolean = false;
  syncSuccess: boolean = false;
  syncError: string = '';

  constructor(
    private projetService: ProjetService,
    private clientService: ClientService,
    private financeDataService: FinanceDataService
  ) {}

  ngOnInit(): void {
    this.loadProjets();
    this.filteredProjets=[];
    this.loadInvoices();
    this.loadClients();
  }
onSearchProjet(): void {
  if (!this.searchProjetTerm.trim()) {
    this.filteredProjets = [];
    return;
  }
  const term = this.searchProjetTerm.toLowerCase().trim();
  this.filteredProjets = this.projets.filter(projet =>
    projet.nom?.toLowerCase().includes(term) ||
    projet.client?.toLowerCase().includes(term) ||
    projet.tjm?.toString().includes(term)
  );
}

selectProjet(projet: any): void {
  this.selectedProjetObj = projet;
  this.selectedProjet = projet.id;        // pour la compatibilité avec l'existant
  this.searchProjetTerm = projet.nom;     // affiche le nom dans l'input
  this.filteredProjets = [];
  this.onProjetChange();                  // déclenche le filtrage des factures
}

clearProjetSelection(): void {
  this.selectedProjetObj = null;
  this.selectedProjet = null;
  this.searchProjetTerm = '';
  this.filteredFactures = [...this.invoices];
  this.selectedFacture = null;
}
  // ==================== CHARGEMENT DES DONNÉES ====================
  loadClients(): void {
    this.clientService.getclientsBD().subscribe({
      next: (data) => {
        this.clients = data.clients || [];
        console.log('Clients chargés :', this.clients.map(c => ({ id: c.id, name: c.name })));
      },
      error: (err) => console.error('Erreur chargement clients:', err)
    });
  }

  loadProjets(): void {
    this.projetService.getProjets().subscribe({
      next: (data) => {
        // Normalisation : id et tjm en nombre
        this.projets = (data || [])
        .filter(p => p.status_paiement?.toLowerCase() === 'en_attente') // 🔥 filtre ici
        .map(p => ({
          ...p,
          id: Number(p.id),
          tjm: Number(p.tjm)
        }));
        console.log('Projets chargés (IDs) :', this.projets.map(p => p.id));
      },
      error: (err) => console.error('Erreur chargement projets:', err)
    });
  }

  loadInvoices(): void {
    this.clientService.getInvoicesBD().subscribe({
      next: (data) => {
        const rawInvoices = data.invoices || [];
        // Normalisation : socid et date_creation en nombre
        this.invoices = rawInvoices.map((v: { socid: any; date_creation: Date; }) => ({
          ...v,
          socid: Number(v.socid),
          date_creation: Number(v.date_creation)
        })).sort((a: any, b: any) => b.date_creation - a.date_creation);
        this.filteredFactures = [...this.invoices];
         this.selectedFacture = null;
        console.log('Factures chargées :', this.invoices);
      },
      error: (err) => console.error('Erreur chargement factures:', err)
    });
  }

  // ==================== AUTOCOMPLÉTION CLIENT ====================
  getClientIdByName(clientName: string): number | null {
    if (!this.clients.length || !clientName) return null;
    const normalizedName = clientName.toLowerCase().trim();
    const client = this.clients.find(c => c.name?.toLowerCase().trim() === normalizedName);
    console.log(`Recherche client "${clientName}" -> normalisé "${normalizedName}" -> trouvé : ${client?.name} (ID ${client?.id})`);
    return client ? Number(client.id) : null;
  }

  getClientNameById(clientId: number | string): string {
    const id = Number(clientId);
    const client = this.clients.find(c => Number(c.id) === id);
    return client ? client.name : 'Client inconnu';
  }

formatDateForDisplay(timestamp: number): string {
  if (!timestamp) return '—';
  const date = this.parseTimestamp(timestamp);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
onProjetChange(): void {
  let projet = this.selectedProjetObj;

  if (!projet && this.selectedProjet) {
    projet = this.projets.find(p => Number(p.id) === this.selectedProjet);
  }

  if (!projet) {
    this.filteredFactures = [...this.invoices];
    this.selectedFacture = null;
    this.projetselectionner = null;
    return;
  }

  this.projetselectionner = projet;

  const tjmProjet = Number(projet.tjm);
  const clientName = projet.client;
  const clientIdProjet = this.getClientIdByName(clientName);

  if (clientIdProjet === null) {
    this.filteredFactures = [];
    this.selectedFacture = null;
    return;
  }

  // 🔹 Filtrage factures : client + tjm + date
  this.filteredFactures = this.invoices.filter(facture => {
    const clientIdFacture = Number(facture.socid);
    const tjmFacture = Number(facture.tjm);

    // Vérifie client + TJM
    if (clientIdFacture !== clientIdProjet || tjmFacture !== tjmProjet) return false;

    // Vérifie date si sélectionnée
    if (this.selectedDate) {
      const [selectedYear, selectedMonth] = this.selectedDate.split('-').map(Number);

      const date = new Date(facture.date * 1000); // timestamp en secondes
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // mois commence à 0

      if (year !== selectedYear || month !== selectedMonth) return false;
    }

    // Facture correspond à tous les critères
    console.log(`Facture OK : ${facture.ref}`);
    return true;
  });

  this.selectedFacture = null;
  console.log(`Nombre de factures filtrées : ${this.filteredFactures.length}`);
}
  // ==================== SYNCHRONISATION ====================
  synchroniserDolibarr(): void {
    if (!this.selectedProjet || !this.selectedDate || !this.selectedFacture) {
      this.syncError = 'Veuillez sélectionner un projet, une facture et une date';
      return;
    }

    this.isSyncing = true;
    this.syncError = '';
    this.syncSuccess = false;

    setTimeout(() => {
      const success = Math.random() > 0.1;
      if (success) {
          // Mettre à jour extractedData
      const factureObj = this.invoices.find(f => f.id === Number(this.selectedFacture));
      console.log('Facture sélectionnée pour extraction :', factureObj);
       const tjm = factureObj.tjm;
      const jours = factureObj.jours_travailles;
      const paye = factureObj?.paye;
      const salarie_id = this.projetselectionner?.salarie_id;
      this.extractedData.tjm = tjm !== undefined ? Number(tjm) : undefined;
      this.extractedData.jours_travailles = jours !== undefined ? Number(jours) : undefined;
      this.extractedData.paye = paye !== undefined ? Number(paye) : undefined;
      this.extractedData.salarie_id = salarie_id;
      this.extractedData.date = this.selectedDate;
      console.log('Données extraites pour Dolibarr :', this.extractedData);

      // Envoyer les données dans le service
      this.sendIfReady();
        this.syncSuccess = true;
      } else {
        this.syncError = 'Erreur de synchronisation avec Dolibarr. Veuillez réessayer.';
      }
      this.isSyncing = false;
      if (success) setTimeout(() => this.syncSuccess = false, 3000);
    }, 2000);
  }
  sendIfReady() {
   if (this.selectedFacture && this.extractedData.tjm === undefined) return;
  if (this.selectedProjet && this.extractedData.paye === undefined) return;
  if (this.selectedDate && this.extractedData.jours_travailles === undefined) return;

    // Fusionner toutes les données extraites
    const mergedData = {
      projet_id: this.selectedProjet,
       tjm: this.extractedData.tjm ,
      jours_travailles: this.extractedData.jours_travailles ,
      paye: this.extractedData.paye ,
      date:this.extractedData.date,
      salarie_id:this.extractedData.salarie_id
    };

    // Envoyer au service partagé
    this.financeDataService.setDolibarData(mergedData);
  }

  resetForm(): void {
    this.selectedProjet = null;
    this.selectedDate = '';
    this.selectedFacture = null;
    this.filteredFactures = [...this.invoices];
    this.syncSuccess = false;
    this.syncError = '';
  }

  // ==================== UTILITAIRES ====================
  get todayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  formatDateWithDay(date: string): string {
    if (!date) return '';
    const [year, month] = date.split('-');
    const mois = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${mois[parseInt(month) - 1]} ${year}`;
  }
  private parseTimestamp(timestamp: number): Date {
  if (!timestamp) return new Date();

  const ts = Number(timestamp);

  // si déjà en millisecondes (13 chiffres)
  if (ts > 100000000000) {
    return new Date(ts);
  }

  // sinon en secondes (10 chiffres)
  return new Date(ts * 1000);
}
}
