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
    this.loadInvoices();
    this.loadClients();
  }

  // ==================== CHARGEMENT DES DONNÉES ====================
  loadClients(): void {
    this.clientService.getClients().subscribe({
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
        this.projets = (data || []).map(p => ({
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
    this.clientService.getInvoices().subscribe({
      next: (data) => {
        const rawInvoices = data.invoices || [];
        // Normalisation : socid et date_creation en nombre
        this.invoices = rawInvoices.map((v: { socid: any; date_creation: Date; }) => ({
          ...v,
          socid: Number(v.socid),
          date_creation: Number(v.date_creation)
        })).sort((a: any, b: any) => b.date_creation - a.date_creation);
        this.filteredFactures = [...this.invoices];
        console.log('Factures chargées, première :', this.invoices[0]);
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
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // ==================== FILTRAGE DES FACTURES ====================
  onProjetChange(): void {
    const projetId = Number(this.selectedProjet);
    console.log('ID projet sélectionné :', projetId);

    if (!projetId) {
      this.filteredFactures = [...this.invoices];
      this.selectedFacture = null;
      return;
    }

    // Vérifier que la liste des projets est chargée
    if (!this.projets.length) {
      console.warn('Liste des projets pas encore chargée');
      return;
    }

    const projet = this.projets.find(p => Number(p.id) === projetId);
    if (!projet) {
      console.warn(`Projet non trouvé pour l'id ${projetId}`);
      console.log('Liste des projets disponibles :', this.projets.map(p => ({ id: p.id, nom: p.nom })));
      this.filteredFactures = [];
      this.selectedFacture = null;
      return;
    }
  this.projetselectionner=projet;
    const tjmProjet = Number(projet.tjm);
    const clientName = projet.client;
    const clientIdProjet = this.getClientIdByName(clientName);

    console.log('Projet trouvé :', projet);
    console.log(`TJM projet : ${tjmProjet}, client projet : ${clientName} (ID ${clientIdProjet})`);

    if (clientIdProjet === null) {
      console.warn(`Client du projet non trouvé : "${clientName}"`);
      this.filteredFactures = [];
      this.selectedFacture = null;
      return;
    }

    // Filtrer les factures correspondant au projet (même TJM et même client)
    this.filteredFactures = this.invoices.filter(facture => {
      const clientIdFacture = Number(facture.socid);
      const line = facture.lines?.[0];
      const tjmFacture = Number(line?.subprice);
      const match = clientIdFacture === clientIdProjet && tjmFacture === tjmProjet;
      if (match) {
        console.log(`Facture correspondante : ${facture.ref} (client ${clientIdFacture}, tjm ${tjmFacture})`);
      }
      return match;
    });

    console.log(`Nombre de factures filtrées : ${this.filteredFactures.length}`);
    this.selectedFacture = null;
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
      const factureObj = this.invoices.find(f => f.id === this.selectedFacture);
      console.log('Facture sélectionnée pour extraction :', factureObj);
       const tjm = factureObj?.lines?.[0]?.subprice;
      const jours = factureObj?.lines?.[0]?.qty;
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
}
