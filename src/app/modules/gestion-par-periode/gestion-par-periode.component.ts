import { Component, OnInit } from '@angular/core';
import { ClientService } from 'src/app/services/client.service';
import { ExtractionService } from 'src/app/services/extraction.service';
import { FinanceDataService } from 'src/app/services/finance-data.service';
import { ProjetService } from 'src/app/services/projet.service';
import { SalarieServiceService } from 'src/app/services/salarie-service.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gestion-par-periode',
  templateUrl: './gestion-par-periode.component.html',
  styleUrls: ['./gestion-par-periode.component.css']
})
export class GestionParPeriodeComponent implements OnInit {
  salaries: any[] = [];
  clients: any[] = [];
  selectedSalarie: any = null;
  salarieSearchTerm = '';
  filteredSalaries: any[] = [];
  invoices: any[] = [];
  extractedData = { paie: [] as any[], frais: [] as any[], km: [] as any[] };
  loading = { paie: false, frais: false, km: false };
  groupedData: any[] = [];
  projetsSalarie: any[] = [];
  selectedFiles = {
  paie: null as File | null,
  frais: null as File | null,
  km: null as File | null
};
selectedFileNames = {
  paie: '',
  frais: '',
  km: ''
};

  constructor(
    private extractionService: ExtractionService,
    private salarieService: SalarieServiceService,
    private projetService: ProjetService,
    private clientService: ClientService,
    private financeDataService: FinanceDataService
  ) {}

  ngOnInit(): void {
    this.loadSalaries();
    this.loadInvoices();
    this.loadClients();
  }

  loadClients(): void {
    this.clientService.getclientsBD().subscribe({
      next: (data) => this.clients = data.clients || [],
      error: (err) => console.error('Erreur chargement clients:', err)
    });
  }

  loadSalaries(): void {
    this.salarieService.getSalaries().subscribe({
      next: (data) => this.salaries = data || [],
      error: (err) => console.error(err)
    });
  }

  loadInvoices(): void {
    this.clientService.getInvoicesBD().subscribe({
      next: (data) => {
        const rawInvoices = data.invoices || [];
        this.invoices = rawInvoices.map((v: any) => ({
          ...v,
          socid: Number(v.socid),
          date_creation: Number(v.date_creation),
          tjm: v.tjm ? Number(v.tjm) : 0
        })).sort((a: { date_creation: number; }, b: { date_creation: number; }) => b.date_creation - a.date_creation);
      },
      error: (err) => console.error('Erreur chargement factures:', err)
    });
  }


  // Recherche salarié
  onSalarieSearch(): void {
    const term = (this.salarieSearchTerm || '').toLowerCase().trim();

    if (!term || !this.salaries || this.salaries.length === 0) {
      this.filteredSalaries = [];
      return;
    }

    this.filteredSalaries = this.salaries.filter(s => {
      const username = (s.username || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const role = (s.role || '').toLowerCase();

      return username.includes(term) || email.includes(term) || role.includes(term);
    });
  }

  selectSalarie(salarie: any): void {
    this.selectedSalarie = salarie;
    this.salarieSearchTerm = salarie.username;
    this.filteredSalaries = [];
    this.onSalarieChange();
  }

  clearSalarieSelection(): void {
    this.selectedSalarie = null;
    this.salarieSearchTerm = '';
    this.filteredSalaries = [];
    this.resetAll();
  }

  onSalarieChange(): void {
    this.resetAll();
    if (this.selectedSalarie) {
      this.loadProjetsForSalarie(this.selectedSalarie.id);
    }
  }

loadProjetsForSalarie(salarieId: number): void {
  this.projetService.getProjetsById(salarieId).subscribe({
    next: (projets) => {

      this.projetsSalarie = (projets || []).filter(p =>
        (p.status_paiement || '').toLowerCase() === 'en_attente'
      );

    },
    error: (err) => console.error(err)
  });
}
  resetAll(): void {
    this.extractedData = { paie: [], frais: [], km: [] };
    this.groupedData = [];
  }

  onFileSelected(event: any, type: 'paie' | 'frais' | 'km'): void {
  const file = event.target.files[0];
  if (!file) return;
  this.selectedFiles[type] = file;
  this.selectedFileNames[type] = file.name;
  this.loading[type] = true;
  let obs;
  switch (type) {
    case 'paie': obs = this.extractionService.extractFicheDePaieZip(file); break;
    case 'frais': obs = this.extractionService.extractNoteDeFraisZip(file); break;
    case 'km': obs = this.extractionService.extractNoteDeFraisKilometriqueZip(file); break;
  }
  obs.subscribe({
    next: (res: any[]) => {
      this.extractedData[type] = res || [];
      this.loading[type] = false;
      this.groupDataByPeriod();
    },
    error: (err) => {
      console.error(err);
      this.loading[type] = false;
    }
  });
}
removeFile(type: 'paie' | 'frais' | 'km'): void {
  this.selectedFiles[type] = null;
  this.selectedFileNames[type] = '';
  // Optionnel : vider les données extraites correspondantes
  this.extractedData[type] = [];
  this.groupDataByPeriod();
}
  groupDataByPeriod(): void {
    const map = new Map<string, any>();
    // Fiches de paie
    for (const item of this.extractedData.paie) {
      const period = this.extractPeriodFromPaie(item.data.periode);
      if (!map.has(period)) {
        map.set(period, {
          periodName: item.data.periode,
          paie: null, frais: null, km: null,
          expanded: false,
          recordsCount: 0,
          projetSearchTerm: '',
          filteredProjets: [],
          selectedProjet: null,
          factureAssociee: null
        });
      }
      const entry = map.get(period);
     entry.paie = {
  ...item.data,
  filename: item.filename
};
      entry.recordsCount++;
    }
    // Notes de frais
    for (const item of this.extractedData.frais) {
      const period = this.extractPeriodFromDate(item.data.date);
      const periodName = this.formatPeriodName(period);
      if (!map.has(period)) {
        map.set(period, {
          periodName,
          paie: null, frais: null, km: null,
          expanded: false,
          recordsCount: 0,
          projetSearchTerm: '',
          filteredProjets: [],
          selectedProjet: null,
          factureAssociee: null
        });
      }
      const entry = map.get(period);
      entry.frais = { ...item.data,
  filename: item.filename};
      entry.recordsCount++;
    }
    // Notes de frais kilométriques
    for (const item of this.extractedData.km) {
      const period = this.extractPeriodFromDate(item.data.date);
      const periodName = this.formatPeriodName(period);
      if (!map.has(period)) {
        map.set(period, {
          periodName,
          paie: null, frais: null, km: null,
          expanded: false,
          recordsCount: 0,
          projetSearchTerm: '',
          filteredProjets: [],
          selectedProjet: null,
          factureAssociee: null
        });
      }
      const entry = map.get(period);
      entry.km = { ...item.data,
  filename: item.filename};
      entry.recordsCount++;
    }
    this.groupedData = Array.from(map.values()).sort((a, b) => b.periodName.localeCompare(a.periodName));
  }

  extractPeriodFromPaie(periodeStr: string): string {
    const months: { [key: string]: string } = {
      'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04', 'mai': '05', 'juin': '06',
      'juillet': '07', 'août': '08', 'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
    };
    const parts = periodeStr.split(' ');
    if (parts.length !== 2) return '';
    const monthFr = parts[0].toLowerCase();
    const year = parts[1];
    const monthNum = months[monthFr] || '01';
    return `${year}-${monthNum}`;
  }

  extractPeriodFromDate(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length >= 2) return `${parts[0]}-${parts[1]}`;
    return '';
  }

  formatPeriodName(period: string): string {
    if (!period) return '';
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  }

  togglePeriod(period: any): void {
    period.expanded = !period.expanded;
  }

  getClientIdByName(clientName: string): number | null {
    if (!this.clients.length || !clientName) return null;
    const normalizedName = clientName.toLowerCase().trim();
    const client = this.clients.find(c => c.name?.toLowerCase().trim() === normalizedName);
    return client ? Number(client.id) : null;
  }

  filterProjetsForPeriod(period: any): void {
    const term = period.projetSearchTerm.toLowerCase().trim();
    if (!term) {
      period.filteredProjets = [];
      return;
    }
    period.filteredProjets = this.projetsSalarie.filter(p =>
      p.nom?.toLowerCase().includes(term) ||
      p.client?.name.toLowerCase().includes(term) ||
      p.tjm?.toString().includes(term)
    );
  }

  selectProjetForPeriod(period: any, projet: any): void {
    period.selectedProjet = projet;
    period.projetSearchTerm = projet.nom;
    period.filteredProjets = [];
    this.associateInvoiceForPeriod(period);
  }

  clearProjetForPeriod(period: any): void {
    period.selectedProjet = null;
    period.projetSearchTerm = '';
    period.factureAssociee = null;
    period.filteredProjets = [];
  }

  associateInvoiceForPeriod(period: any): void {
    const projet = period.selectedProjet;
    if (!projet) {
      period.factureAssociee = null;
      return;
    }

    const tjmProjet = Number(projet.tjm);
    const clientName = projet.client?.name;
    const clientIdProjet = this.getClientIdByName(clientName);

    if (!clientIdProjet) {
      console.warn(`Client non trouvé : ${clientName}`);
      period.factureAssociee = null;
      return;
    }

    const periodDate = this.parsePeriodToDate(period.periodName);
    if (!periodDate) {
      console.warn(`Impossible de parser la période : ${period.periodName}`);
      period.factureAssociee = null;
      return;
    }

    const periodYearMonth = `${periodDate.getFullYear()}-${periodDate.getMonth() + 1}`;

    const factureTrouvee = this.invoices.find(facture => {
      const clientIdFacture = Number(facture.socid);
      const tjmFacture = Number(facture.tjm);
      if (isNaN(tjmFacture)) return false;
      const factureDate = new Date(facture.date_creation * 1000);
      const factureYearMonth = `${factureDate.getFullYear()}-${factureDate.getMonth() + 1}`;
      return (clientIdFacture === clientIdProjet) &&
             (tjmFacture === tjmProjet) &&
             (factureYearMonth === periodYearMonth);
    });

    period.factureAssociee = factureTrouvee || null;
    if (!factureTrouvee) {
      console.warn(`❌ Aucune facture trouvée pour client ${clientIdProjet} (${clientName}), TJM ${tjmProjet}, période ${periodYearMonth}`);
    }
  }

  parsePeriodToDate(periodName: string): Date | null {
    const months: { [key: string]: number } = {
      'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
      'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
    };
    const parts = periodName.toLowerCase().split(' ');
    if (parts.length !== 2) return null;
    const month = months[parts[0]];
    const year = parseInt(parts[1]);
    if (isNaN(month) || isNaN(year)) return null;
    return new Date(year, month, 1);
  }
  convertPeriodToYYYYMM(periodName: string): string {
  const months: { [key: string]: string } = {
    'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04', 'mai': '05', 'juin': '06',
    'juillet': '07', 'août': '08', 'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
  };

  const parts = periodName.toLowerCase().split(' ');
  if (parts.length !== 2) return '';

  const month = months[parts[0]];
  const year = parts[1];

  return `${year}-${month}`;
}

 savePeriodData(period: any): void {

  // 🔹 Récupération des valeurs
  const netAvantImpot = Number(period.paie.net_avant_impot);
  const repasRestaurant = Number(period.paie.repas_restaurant );
  const totalNoteFrais = Number(period.frais?.total_a_verser );
  const totalNoteKilometrique = Number(period.km?.total_en_euro );
  const facture = Number(period.factureAssociee.total_ht);
  const paye = Number(period.factureAssociee.paye );

  // 🔹 Calculs
  const netHorsRepas =
    Math.round((netAvantImpot - repasRestaurant) * 100) / 100;

  const totalPercu =
    Math.round((netAvantImpot + totalNoteFrais + totalNoteKilometrique) * 100) / 100;

  const factureTotale =
    Math.round((paye * facture) * 100) / 100;

  const rentabilite =
    Number((factureTotale - totalPercu).toFixed(2));

  // 🔹 Construction objet backend
  const dataToSave = {
    salarie_id: this.selectedSalarie.id,
    date: this.convertPeriodToYYYYMM(period.periodName),

    joursTravailles: Number(period.factureAssociee.jours_travailles || 0),
    paye: paye,
    tjm: Number(period.factureAssociee.tjm || 0),

    salaireBrut: Number(period.paie.salaire_brut || 0),
    netAvantImpot: netAvantImpot,
    netPayer: Number(period.paie.net_paye || 0),
    chargesPatronales: Number(period.paie.charges_patronales || 0),

    facture: facture,
    repasRestaurant: repasRestaurant,
    totalCotisationsSalariales: Number(period.paie.total_cotisations_salariales || 0),

    totalNoteFrais: totalNoteFrais,
    totalNoteKilometrique: totalNoteKilometrique,

    totalePercu: totalPercu,
    totaleFacture: factureTotale,
    salaireNetHorsRepas: netHorsRepas,

    projet_id: period.selectedProjet.id,
    rentabilite: rentabilite
  };

  this.financeDataService.getHistoriques().subscribe({
    next: (historiques) => {

      const existing = historiques.find(h =>
        h.date === dataToSave.date &&
        h.salarie_id === dataToSave.salarie_id &&
        h.projet_id === dataToSave.projet_id
      );

      // ─────────────────────────────
      // 🔁 UPDATE
      // ─────────────────────────────
      if (existing) {

        this.financeDataService.updateHistorique(existing.id, dataToSave)
          .subscribe({
            next: (res) => {
              console.log("✅ Historique mis à jour :", res);
            Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Les données ont été mis à jour avec succès',
        confirmButtonColor: '#28a745',
        timer: 2000,
        showConfirmButton: false
      });
            },
            error: (err) => {
              console.error("Erreur update :", err);
                Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de l’enregistrement',
        confirmButtonColor: '#dc3545'
      });
            }
          });

      }

      // ─────────────────────────────
      // ➕ CREATE
      // ─────────────────────────────
      else {

        this.financeDataService.createHistorique(dataToSave)
          .subscribe({
            next: (res) => {
              console.log("✅ Historique créé :", res);
              Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Les données ont été créées avec succès',
        confirmButtonColor: '#28a745',
        timer: 2000,
        showConfirmButton: false
      });
            },
            error: (err) => {
              console.error("Erreur create :", err);
              Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de l’enregistrement',
        confirmButtonColor: '#dc3545'
      });
            }
          });

      }
    }
  });
}
  get areAllFilesUploaded(): boolean {
  return this.selectedFiles.paie !== null &&
         this.selectedFiles.frais !== null &&
         this.selectedFiles.km !== null;
}
  isEmpty(value: any): boolean {
  return value === null || value === undefined || value === '' || isNaN(value);
}
  isPeriodValid(period: any): boolean {
     if (!period.factureAssociee) return false;
      if (this.isEmpty(period.factureAssociee.tjm) ||
      this.isEmpty(period.factureAssociee.total_ht) ||
      this.isEmpty(period.factureAssociee.jours_travailles) ||
      this.isEmpty(period.factureAssociee.paye)) {
    return false;
  }

   if (period.paie) {
    if (this.isEmpty(period.paie.salaire_brut) ||
        this.isEmpty(period.paie.total_cotisations_salariales) ||
        this.isEmpty(period.paie.charges_patronales) ||
        this.isEmpty(period.paie.repas_restaurant) ||
        this.isEmpty(period.paie.net_avant_impot) ||
        this.isEmpty(period.paie.net_paye)) {
      return false;
    }
  }

  // Vérifier les champs de la note de frais si elle existe
  if (period.frais && this.isEmpty(period.frais.total_a_verser)) {
    return false;
  }

  // Vérifier les champs de la note kilométrique si elle existe
  if (period.km && this.isEmpty(period.km.total_en_euro)) {
    return false;
  }

  return true;
}
}
