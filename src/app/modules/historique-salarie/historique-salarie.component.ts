import { Component, OnInit } from '@angular/core';
import { FinanceDataService } from 'src/app/services/finance-data.service';
import { PredictionIAService } from 'src/app/services/prediction-ia.service';
import { ProjetService } from 'src/app/services/projet.service';
import { SalarieServiceService } from 'src/app/services/salarie-service.service';

@Component({
  selector: 'app-historique-salarie',
  templateUrl: './historique-salarie.component.html',
  styleUrls: ['./historique-salarie.component.css']
})
export class HistoriqueSalarieComponent implements OnInit {
  // Données
  allHistoriques: any[] = [];
  salaries: any[] = [];
  selectedSalarie: any = null;
  filteredHistoriques: any[] = [];
  searchTerm = '';
  isLoading = false;

  // Projets
  projetsSalarie: any[] = [];
  selectedProjetId: number | null = null;
  allHistoriquesBackup: any[] = [];

  // Recherche projet
  projetSearchTerm = '';
  filteredProjets: any[] = [];
  selectedProjetObj: any = null;

  // Filtres année/mois
  selectedYearFilter = '';
  selectedMonthFilter = '';
  allYearsForProject: string[] = [];
  availableMonthsForYear: { name: string; value: string }[] = [];

  // Structure hiérarchique brute et filtrée
  rawHierarchy: Array<{
    year: string;
    months: Array<{
      month: number;
      monthName: string;
      records: any[];
    }>;
  }> = [];
  filteredHierarchy: Array<{
    year: string;
    expanded: boolean;
    months: Array<{
      month: number;
      monthName: string;
      expanded: boolean;
      records: any[];
      pageSize: number;
      currentPage: number;
      totalPages: number;
      paginatedRecords: any[];
    }>;
  }> = [];

  recordsPerPage = 3;

  // Modals
  showRecordModal = false;
  selectedRecord: any = null;

  // Pagination salariés
  currentPage = 1;
  pageSize = 4;

  // Onglet actif
  activeTab: 'historique' | 'previsions' = 'historique';

  // Prévisions IA
  previsionData: any = null;
  loadingPrevision: boolean = false;

  constructor(
    private salarieService: SalarieServiceService,
    private financeDataService: FinanceDataService,
    private projetService: ProjetService,
    private predictionIAService: PredictionIAService
  ) {}

  ngOnInit(): void {
    this.loadSalaries();
    this.loadHistoriques();
  }

  loadSalaries(): void {
    this.isLoading = true;
    this.salarieService.getSalaries().subscribe({
      next: (data) => { this.salaries = data || []; this.isLoading = false; },
      error: (err) => { this.isLoading = false; console.error(err); }
    });
  }

  loadHistoriques(): void {
    this.financeDataService.getHistoriques().subscribe({
      next: (data) => {
        this.allHistoriques = data || [];
        if (this.selectedSalarie) this.filterHistoriquesBySalarie(this.selectedSalarie);
      },
      error: (err) => console.error('Erreur chargement historiques', err)
    });
  }

  filterHistoriquesBySalarie(salarie: any): void {
    this.filteredHistoriques = this.allHistoriques.filter(h => h.salarie_id === salarie.id);
  }

  selectSalarie(salarie: any): void {
    this.selectedSalarie = salarie;
    this.filterHistoriquesBySalarie(salarie);
    this.loadProjetsForSalarie(salarie.id);
    this.clearProjetSelection();
    this.currentPage = 1;
  }

  loadProjetsForSalarie(salarieId: number): void {
    this.projetService.getProjetsById(salarieId).subscribe({
      next: (projets) => { this.projetsSalarie = projets || []; },
      error: (err) => console.error(err)
    });
  }

  // Recherche projet
  onProjetSearch(): void {
    const term = this.projetSearchTerm.toLowerCase().trim();
    if (!term) { this.filteredProjets = []; return; }
    this.filteredProjets = this.projetsSalarie.filter(p =>
      p.nom?.toLowerCase().includes(term) ||
      p.client?.toLowerCase().includes(term) ||
      p.tjm?.toString().includes(term)
    );
  }

  selectProjet(projet: any): void {
    this.selectedProjetObj = projet;
    this.projetSearchTerm = projet.nom;
    this.filteredProjets = [];
    this.selectedProjetId = projet.id;
    if (this.allHistoriquesBackup.length === 0) this.allHistoriquesBackup = [...this.filteredHistoriques];
    this.filteredHistoriques = this.allHistoriquesBackup.filter(record => record.projet_id === projet.id);
    this.buildRawHierarchy();
    this.initFiltersFromData();
    this.applyPreciseFilter();

    // Charger les prévisions si l'onglet actif est 'previsions'
    if (this.activeTab === 'previsions') {
      this.loadPrevision(projet.id);
    }
  }

  clearProjetSelection(): void {
    this.selectedProjetObj = null;
    this.selectedProjetId = null;
    this.projetSearchTerm = '';
    this.filteredProjets = [];
    this.selectedYearFilter = '';
    this.selectedMonthFilter = '';
    this.allYearsForProject = [];
    this.availableMonthsForYear = [];
    if (this.allHistoriquesBackup.length) {
      this.filteredHistoriques = [...this.allHistoriquesBackup];
      this.allHistoriquesBackup = [];
    } else if (this.selectedSalarie) this.filterHistoriquesBySalarie(this.selectedSalarie);
    this.rawHierarchy = [];
    this.filteredHierarchy = [];
    this.previsionData = null; // reset prévisions
  }

  // Construction de la hiérarchie brute (année -> mois -> enregistrements)
  buildRawHierarchy(): void {
    const map = new Map<string, Map<number, any[]>>();
    for (const record of this.filteredHistoriques) {
      const date = new Date(record.date);
      const year = date.getFullYear().toString();
      const month = date.getMonth() + 1;
      if (!map.has(year)) map.set(year, new Map());
      const monthMap = map.get(year)!;
      if (!monthMap.has(month)) monthMap.set(month, []);
      monthMap.get(month)!.push(record);
    }
    const years = Array.from(map.keys()).sort().reverse();
    this.rawHierarchy = [];
    for (const year of years) {
      const monthMap = map.get(year)!;
      const months = Array.from(monthMap.keys()).sort((a,b) => b - a);
      const monthsData = months.map(month => ({
        month,
        monthName: new Date(2000, month-1, 1).toLocaleString('fr-FR', { month: 'long' }),
        records: monthMap.get(month)!.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }));
      this.rawHierarchy.push({ year, months: monthsData });
    }
  }

  initFiltersFromData(): void {
    const yearsSet = new Set<string>();
    for (const yearData of this.rawHierarchy) yearsSet.add(yearData.year);
    this.allYearsForProject = Array.from(yearsSet).sort().reverse();
    this.selectedYearFilter = '';
    this.selectedMonthFilter = '';
    this.availableMonthsForYear = [];
  }

  onYearFilterChange(): void {
    this.selectedMonthFilter = '';
    if (!this.selectedYearFilter) {
      this.availableMonthsForYear = [];
    } else {
      const yearData = this.rawHierarchy.find(y => y.year === this.selectedYearFilter);
      if (yearData) {
        this.availableMonthsForYear = yearData.months.map(m => ({ name: m.monthName, value: m.month.toString() }));
      } else {
        this.availableMonthsForYear = [];
      }
    }
    this.applyPreciseFilter();
  }

  applyPreciseFilter(): void {
    let filtered = [...this.rawHierarchy];
    if (this.selectedYearFilter) {
      filtered = filtered.filter(yr => yr.year === this.selectedYearFilter);
    }
    if (this.selectedMonthFilter) {
      const monthNum = parseInt(this.selectedMonthFilter);
      filtered = filtered.map(yr => ({
        ...yr,
        months: yr.months.filter(m => m.month === monthNum)
      })).filter(yr => yr.months.length > 0);
    }
    this.filteredHierarchy = filtered.map(yr => ({
      year: yr.year,
      expanded: false,
      months: yr.months.map(m => {
        const totalPages = Math.ceil(m.records.length / this.recordsPerPage);
        return {
          month: m.month,
          monthName: m.monthName,
          expanded: false,
          records: m.records,
          pageSize: this.recordsPerPage,
          currentPage: 1,
          totalPages,
          paginatedRecords: m.records.slice(0, this.recordsPerPage)
        };
      })
    }));
  }

  clearFilters(): void {
    this.selectedYearFilter = '';
    this.selectedMonthFilter = '';
    this.availableMonthsForYear = [];
    this.applyPreciseFilter();
  }

  toggleYear(year: string): void {
    const yearData = this.filteredHierarchy.find(y => y.year === year);
    if (yearData) yearData.expanded = !yearData.expanded;
  }

  toggleMonth(year: string, month: number): void {
    const yearData = this.filteredHierarchy.find(y => y.year === year);
    if (yearData) {
      const monthData = yearData.months.find(m => m.month === month);
      if (monthData) monthData.expanded = !monthData.expanded;
    }
  }

  changeMonthPage(year: string, month: number, newPage: number): void {
    const yearData = this.filteredHierarchy.find(y => y.year === year);
    if (yearData) {
      const monthData = yearData.months.find(m => m.month === month);
      if (monthData && newPage >= 1 && newPage <= monthData.totalPages) {
        monthData.currentPage = newPage;
        const start = (newPage - 1) * monthData.pageSize;
        monthData.paginatedRecords = monthData.records.slice(start, start + monthData.pageSize);
      }
    }
  }

  // Getters
  get filteredSalaries(): any[] {
    if (!this.searchTerm) return this.salaries;
    const term = this.searchTerm.toLowerCase();
    return this.salaries.filter(s => {
      const username = s.username ? s.username.toLowerCase() : '';
      const email = s.email ? s.email.toLowerCase() : '';
      return username.includes(term) || email.includes(term) ;
    });
  }
  get paginatedSalaries(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredSalaries.slice(start, start + this.pageSize);
  }
  get totalPages(): number { return Math.ceil(this.filteredSalaries.length / this.pageSize); }
  changePage(page: number): void { if (page>=1 && page<=this.totalPages) this.currentPage = page; }

  get totalRecords(): number { return this.filteredHistoriques.length; }
  get totalSalary(): number { return this.filteredHistoriques.reduce((s,r)=> s+(r.salaireBrut||0),0); }
  get totalFacture(): number { return this.filteredHistoriques.reduce((s,r)=> s+(r.facture||0),0); }
  get totalRentabilite(): number { return this.filteredHistoriques.reduce((s,r)=> s+(r.rentabilite||0),0); }

  // Modals
  openRecordModal(record: any): void { this.selectedRecord = record; this.showRecordModal = true; }
  closeRecordModal(): void { this.showRecordModal = false; this.selectedRecord = null; }

  // Export CSV
  exportToCSV(): void {
    if (!this.selectedProjetObj) return;
    const recordsToExport = this.filteredHistoriques;
    if (recordsToExport.length === 0) {
      alert('Aucun enregistrement à exporter pour ce projet.');
      return;
    }
    const columns = [
      'date', 'salaireBrut', 'netPayer', 'chargesPatronales', 'repasRestaurant',
      'totalCotisationsSalariales', 'totalNoteFrais', 'totalNoteKilometrique',
      'tjm', 'joursTravailles', 'facture', 'paye', 'totalePercu', 'totaleFacture', 'rentabilite'
    ];
    const headers = [
      'Date', 'Salaire brut', 'Net payer', 'Charges patronales', 'Repas restaurant',
      'Total cotisations salariales', 'Total notes de frais', 'Total notes kilométriques',
      'TJM', 'Jours travaillés', 'Facture', 'Payé', 'Total perçu', 'Total facture', 'Rentabilité'
    ];
    const rows = recordsToExport.map(record =>
      columns.map(col => record[col] !== undefined && record[col] !== null ? record[col] : '').join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const fileName = `historique_projet_${this.selectedProjetObj.nom}_${new Date().toISOString().slice(0, 19)}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Prévisions IA
  loadPrevision(projetId: number) {
    this.loadingPrevision = true;
    this.predictionIAService.getPrevisionMarge(projetId).subscribe({
      next: (data) => {
        this.previsionData = data;
        this.loadingPrevision = false;
      },
      error: (err) => {
        console.error('Erreur chargement prévisions', err);
        alert('Impossible de charger les prévisions pour ce projet.');
        this.loadingPrevision = false;
      }
    });
  }

  // Changement d'onglet
  setActiveTab(tab: 'historique' | 'previsions') {
    this.activeTab = tab;
    if (tab === 'previsions' && this.selectedProjetObj && !this.previsionData) {
      this.loadPrevision(this.selectedProjetObj.id);
    }
  }

  // Calculs pour les KPIs
  getAvgCaEstime(): number {
    if (!this.previsionData?.predictions) return 0;
    const sum = this.previsionData.predictions.reduce((acc: number, p: any) => acc + (p.ca_estime || 0), 0);
    return sum / this.previsionData.predictions.length;
  }

  getAvgMargePaye(): number {
    if (!this.previsionData?.predictions) return 0;
    const sum = this.previsionData.predictions.reduce((acc: number, p: any) => acc + (p.marge_si_paye || 0), 0);
    return sum / this.previsionData.predictions.length;
  }
}
