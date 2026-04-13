import { Salarie } from './../../services/salarie-service.service';
import { Component, OnInit } from '@angular/core';
import { ClientService } from 'src/app/services/client.service';
import { ExtractionService } from 'src/app/services/extraction.service';
import { FinanceDataService } from 'src/app/services/finance-data.service';
import { ProjetService } from 'src/app/services/projet.service';
import { SalarieServiceService } from 'src/app/services/salarie-service.service';

@Component({
  selector: 'app-gestion-par-salaries',
  templateUrl: './gestion-par-salaries.component.html',
  styleUrls: ['./gestion-par-salaries.component.css']
})
export class GestionParSalariesComponent implements OnInit {
  clients: any[] = [];
  invoices: any[] = [];
  extractedData = { paie: [] as any[], frais: [] as any[], km: [] as any[] };
  loading = { paie: false, frais: false, km: false };
  groupedDataBySalarie: Map<string, any[]> = new Map();
  salariesList: { displayName: string; normalizedKey: string; periodsCount: number }[] = [];
  selectedSalarieKey: string | null = null;
  selectedSalarieDisplayName: string | null = null;
  groupedDataForSalarie: any[] = [];
  projetsSalarie: any[] = [];

  selectedFiles = { paie: null as File | null, frais: null as File | null, km: null as File | null };
  selectedFileNames = { paie: '', frais: '', km: '' };

  constructor(
    private extractionService: ExtractionService,
    private projetService: ProjetService,
    private clientService: ClientService,
    private financeDataService: FinanceDataService,
    private salarieService: SalarieServiceService
  ) {}

  ngOnInit(): void {
    this.loadClients();
    this.loadInvoices();
  }

  loadClients(): void {
    this.clientService.getclientsBD().subscribe({
      next: (data) => this.clients = data.clients || [],
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
        }));
      },
      error: (err) => console.error(err)
    });
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
        this.regroupDataBySalarie();
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
    this.extractedData[type] = [];
    this.regroupDataBySalarie();
  }

  regroupDataBySalarie(): void {
    const mapBySalarie = new Map<string, Map<string, any>>();
    const displayNameMap = new Map<string, string>();

    const addToMap = (rawNom: string, periodKey: string, periodName: string, type: string, data: any, filename: string) => {
      const normalized = this.normalizeName(rawNom);
      if (!displayNameMap.has(normalized)) {
        displayNameMap.set(normalized, rawNom);
      }
      if (!mapBySalarie.has(normalized)) {
        mapBySalarie.set(normalized, new Map());
      }
      const periodMap = mapBySalarie.get(normalized)!;
      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, {
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
      const periodData = periodMap.get(periodKey);
      if (type === 'paie') periodData.paie = { ...data, filename };
      if (type === 'frais') periodData.frais = { ...data, filename };
      if (type === 'km') periodData.km = { ...data, filename };
      periodData.recordsCount++;
    };

    for (const item of this.extractedData.paie) {
      const rawNom = item.data.nom_salarie || 'Inconnu';
      const periodKey = this.extractPeriodFromPaie(item.data.periode);
      const periodName = this.formatPeriodName(periodKey);
      addToMap(rawNom, periodKey, periodName, 'paie', item.data, item.filename);
    }
    for (const item of this.extractedData.frais) {
      const rawNom = item.data.nom_salarie || 'Inconnu';
      const periodKey = this.extractPeriodFromDate(item.data.date);
      const periodName = this.formatPeriodName(periodKey);
      addToMap(rawNom, periodKey, periodName, 'frais', item.data, item.filename);
    }
    for (const item of this.extractedData.km) {
      const rawNom = item.data.nom_salarie || 'Inconnu';
      const periodKey = this.extractPeriodFromDate(item.data.date);
      const periodName = this.formatPeriodName(periodKey);
      addToMap(rawNom, periodKey, periodName, 'km', item.data, item.filename);
    }

    this.salariesList = [];
    this.groupedDataBySalarie.clear();
    for (const [normalized, periodMap] of mapBySalarie) {
      const periods = Array.from(periodMap.values()).sort((a, b) => b.periodName.localeCompare(a.periodName));
      this.groupedDataBySalarie.set(normalized, periods);
      const displayName = displayNameMap.get(normalized) || normalized;
      this.salariesList.push({
        displayName: displayName,
        normalizedKey: normalized,
        periodsCount: periods.length
      });
    }

    if (this.selectedSalarieKey && this.groupedDataBySalarie.has(this.selectedSalarieKey)) {
      this.groupedDataForSalarie = this.groupedDataBySalarie.get(this.selectedSalarieKey)!;
    } else {
      this.selectedSalarieKey = null;
      this.selectedSalarieDisplayName = null;
      this.groupedDataForSalarie = [];
    }
  }

  selectSalarieByKey(key: string): void {
    this.selectedSalarieKey = key;
    this.groupedDataForSalarie = this.groupedDataBySalarie.get(key) || [];
    const found = this.salariesList.find(s => s.normalizedKey === key);
    this.selectedSalarieDisplayName = found ? found.displayName : key;
    this.loadProjetsForSalarie(key);
    this.groupedDataForSalarie.forEach(p => {
    p.projetSearchTerm = '';
    p.filteredProjets = [];
  });
  }

 loadProjetsForSalarie(normalizedKey: string): void {
  this.projetService.getProjets().subscribe({
    next: (projets) => {

      const projetsSalarie = projets.filter(p =>
        p.salarie?.username &&
        this.normalizeName(p.salarie.username) === normalizedKey
      );

      this.projetsSalarie = projetsSalarie.length > 0 ? projetsSalarie : projets;
    },
    error: (err) => console.error(err)
  });
}

  // ... (toutes les autres méthodes : extractPeriodFromPaie, extractPeriodFromDate, formatPeriodName, togglePeriod,
  // getClientIdByName, filterProjetsForPeriod, selectProjetForPeriod, clearProjetForPeriod,
  // associateInvoiceForPeriod, parsePeriodToDate, convertPeriodToYYYYMM, savePeriodData,
  // areAllFilesUploaded, isEmpty, isPeriodValid, normalizeName) sont identiques à votre code.
  // Je les rappelle ci-dessous par souci de complétude mais vous pouvez les conserver.

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
  const term = period.projetSearchTerm?.toLowerCase().trim();

  // Toujours partir des projets du salarié sélectionné
  const base = this.projetsSalarie || [];

  if (!term) {
    period.filteredProjets = base;
    return;
  }

  period.filteredProjets = base.filter(p =>
    (p.nom || '').toLowerCase().includes(term) ||
    (p.client || '').toLowerCase().includes(term) ||
    (p.tjm || '').toString().includes(term)
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
    const clientName = projet.client;
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
    if (!this.selectedSalarieKey) {
      alert('Veuillez sélectionner un salarié.');
      return;
    }
    const netAvantImpot = Number(period.paie.net_avant_impot);
    const repasRestaurant = Number(period.paie.repas_restaurant);
    const totalNoteFrais = Number(period.frais?.total_a_verser || 0);
    const totalNoteKilometrique = Number(period.km?.total_en_euro || 0);
    const facture = Number(period.factureAssociee.total_ht);
    const paye = Number(period.factureAssociee.paye);
    const netHorsRepas = netAvantImpot - repasRestaurant;
    const totalPercu = netHorsRepas + repasRestaurant + totalNoteFrais + totalNoteKilometrique;
    const factureTotale = (paye ? 1 : 0) * facture;
    const rentabilite = factureTotale - totalPercu;
    const dataToSave = {
      salarie_id:period.selectedProjet.salarie_id,
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
      projet_id: period.selectedProjet?.id || null,
      rentabilite: rentabilite
    };
    console.log("✅ Données envoyées :", dataToSave);
    this.financeDataService.createHistorique(dataToSave).subscribe({
      next: (res) => console.log('Historique créé avec succès :', res),
      error: (err) => console.error('Erreur lors de la création de l\'historique :', err)
    });
    alert(`Données sauvegardées pour ${period.periodName}`);
  }

  get areAllFilesUploaded(): boolean {
    return this.selectedFiles.paie !== null && this.selectedFiles.frais !== null && this.selectedFiles.km !== null;
  }

  isEmpty(value: any): boolean {
    return value === null || value === undefined || value === '' || isNaN(value);
  }

  isPeriodValid(period: any): boolean {
    if (!period.factureAssociee) return false;
    if (this.isEmpty(period.factureAssociee.tjm) ||
        this.isEmpty(period.factureAssociee.total_ht) ||
        this.isEmpty(period.factureAssociee.jours_travailles) ||
        this.isEmpty(period.factureAssociee.paye)) return false;
    if (period.paie) {
      if (this.isEmpty(period.paie.salaire_brut) ||
          this.isEmpty(period.paie.total_cotisations_salariales) ||
          this.isEmpty(period.paie.charges_patronales) ||
          this.isEmpty(period.paie.repas_restaurant) ||
          this.isEmpty(period.paie.net_avant_impot) ||
          this.isEmpty(period.paie.net_paye)) return false;
    }
    if (period.frais && this.isEmpty(period.frais.total_a_verser)) return false;
    if (period.km && this.isEmpty(period.km.total_en_euro)) return false;
    return true;
  }

  normalizeName(name: string): string {
    if (!name) return 'inconnu';
    let normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const words = normalized.split(/\s+/).filter(w => w.length > 0);
    words.sort();
    return words.join(' ');
  }
}
