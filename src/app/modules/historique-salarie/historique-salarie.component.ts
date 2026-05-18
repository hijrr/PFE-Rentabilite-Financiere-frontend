import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChartConfiguration } from 'chart.js';
import { FinanceDataService } from 'src/app/services/finance-data.service';
import { PredictionIAService } from 'src/app/services/prediction-ia.service';
import { ProjetService } from 'src/app/services/projet.service';
import { SalarieServiceService } from 'src/app/services/salarie-service.service';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx-js-style';
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

  // Structure hiérarchique
  rawHierarchy: Array<{
    year: string;
    months: Array<{ month: number; monthName: string; records: any[] }>;
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
  showRecordModal = false;
  selectedRecord: any = null;

  // Pagination salariés
  currentPage = 1;
  pageSize = 4;

  // Onglet actif
  activeTab: 'historique' | 'previsions' = 'historique';

  // Prévisions IA
  previsionData: any = null;
  loadingPrevision = false;

  // Configuration graphique
  lineChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  lineChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const index = context.dataIndex;
            const pred = this.previsionData?.predictions[index];
            if (pred) {
              if (context.dataset.label === '🔒 Probabilité de paiement') {
                return `Probabilité: ${(pred.prob_paiement * 100).toFixed(1)}%`;
              } else {
                return `${context.dataset.label}: ${context.raw.toFixed(2)} €`;
              }
            }
            return `${context.raw} €`;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: { callback: (val: number) => val + ' €' },
        title: { display: true, text: 'Marge (€)' }
      },
      y1: {
        position: 'right',
        title: { display: true, text: 'Probabilité' },
        min: 0,
        max: 1,
        grid: { drawOnChartArea: false },
        ticks: { callback: (val: number) => (val * 100) + '%' }
      }
    }
  };

  historyChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  historyChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } }
  };

  constructor(
    private salarieService: SalarieServiceService,
    private financeDataService: FinanceDataService,
    private projetService: ProjetService,
    private predictionIAService: PredictionIAService,
     private sanitizer: DomSanitizer
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
      error: (err) => console.error(err)
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
      next: (projets) => {
        const enAttente = (projets || []).filter(p =>
          (p.status_paiement || '').toString().trim().toLowerCase() === 'en_attente'
        );
        this.projetsSalarie = enAttente;
      },
      error: (err) => console.error(err)
    });
  }

onProjetSearch(): void {
  const term = this.projetSearchTerm.toLowerCase().trim();
  if (!term) { this.filteredProjets = []; return; }
  this.filteredProjets = this.projetsSalarie.filter(p =>
    p.nom?.toLowerCase().includes(term) ||
    p.client?.name?.toLowerCase().includes(term) ||  // ✅ objet imbriqué
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
    this.previsionData = null;
  }

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
      const months = Array.from(monthMap.keys()).sort((a, b) => b - a);
      const monthsData = months.map(month => ({
        month,
        monthName: new Date(2000, month - 1, 1).toLocaleString('fr-FR', { month: 'long' }),
        records: monthMap.get(month)!.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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

  get filteredSalaries(): any[] {
    if (!this.searchTerm) return this.salaries;
    const term = this.searchTerm.toLowerCase();
    return this.salaries.filter(s =>
      (s.username?.toLowerCase().includes(term) || s.email?.toLowerCase().includes(term))
    );
  }

  get paginatedSalaries(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredSalaries.slice(start, start + this.pageSize);
  }

  get totalPages(): number { return Math.ceil(this.filteredSalaries.length / this.pageSize); }
  changePage(page: number): void { if (page >= 1 && page <= this.totalPages) this.currentPage = page; }

  get totalRecords(): number { return this.filteredHistoriques.length; }
  get totalSalary(): number { return this.filteredHistoriques.reduce((s, r) => s + (r.salaireBrut || 0), 0); }
  get totalFacture(): number { return this.filteredHistoriques.reduce((s, r) => s + (r.facture || 0), 0); }
  get totalRentabilite(): number { return this.filteredHistoriques.reduce((s, r) => s + (r.rentabilite || 0), 0); }

  openRecordModal(record: any): void { this.selectedRecord = record; this.showRecordModal = true; }
  closeRecordModal(): void { this.showRecordModal = false; this.selectedRecord = null; }

exportToCSV(): void {
  if (!this.selectedProjetObj) return;
  const records = [...this.filteredHistoriques];
  if (records.length === 0) {  Swal.fire({
        icon: 'warning',
        title: 'Aucun enregistrement',
        text: 'Il n’y a aucun enregistrement à exporter.',
        confirmButtonText: 'OK'
    });
    return; }
  records.sort((a, b) => new Date(a.date + '-01').getTime() - new Date(b.date + '-01').getTime());

  // Calcul du total des rentabilités
  const totalRentabilite = records.reduce((sum, r) => sum + (r.rentabilite || 0), 0);

  const headers = [
    'Fact', 'TJM', 'Jours', 'Facture', 'Payé', 'Total Facturé',
    'Salaire Brut', 'Salaire net FP après PAS', 'Salaire net FP avant PAS',
    'Salaire Net hors repas', 'Frais Repas', 'Frais Kilo', 'Autre Frais',
    'Total Perçu', 'Charges Patronales', 'Charges Salariales', 'Rentabilité'
  ];

  // Construction des lignes de données + ligne de total
  const dataRows = records.map(r => [
    r.date, r.tjm || 0, r.joursTravailles || 0, r.facture || 0,
    r.paye || 0, r.totaleFacture || 0, r.salaireBrut || 0,
    r.netPayer || 0, r.netAvantImpot || 0, r.salaireNetHorsRepas || 0,
    r.repasRestaurant || 0, r.totalNoteKilometrique || 0, r.totalNoteFrais || 0,
    r.totalePercu || 0, r.chargesPatronales || 0, r.totalCotisationsSalariales || 0, r.rentabilite || 0
  ]);

  // Ligne de total (seule la colonne Rentabilité est remplie)
  const totalRow = new Array(headers.length).fill('');
  totalRow[0] = 'TOTAL';                     // première colonne
  totalRow[headers.length - 1] = totalRentabilite; // dernière colonne (Rentabilité)

  const wsData: any[][] = [
    [],                                    // ligne vide en tête (optionnelle)
    headers,
    ...dataRows,
    totalRow                               // ligne de total ajoutée à la fin
  ];

  // ... (le reste du code : création de la feuille, styles, etc. inchangé)

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const totalPercuCol = 13;
  const rentabiliteCol = 16;
  const specialCols = [totalPercuCol, rentabiliteCol];

  const thickBorder = {
    top: { style: 'medium', color: { rgb: '000000' } },
    bottom: { style: 'medium', color: { rgb: '000000' } },
    left: { style: 'medium', color: { rgb: '000000' } },
    right: { style: 'medium', color: { rgb: '000000' } }
  };

  const thinBorder = {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  };

  // Style des en-têtes (ligne 1)
  for (let c = 0; c < headers.length; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 1, c });
    if (!ws[cellRef]) continue;
    const isSpecial = specialCols.includes(c);
    ws[cellRef].s = {
      font: { bold: true, sz: 10 },
      fill: { patternType: 'solid', fgColor: { rgb: isSpecial ? '70AD47' : 'D9D9D9' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: thickBorder
    };
  }

  // Style des données (lignes 2 à N-1)
  for (let r = 2; r < 2 + dataRows.length; r++) {
    for (let c = 0; c < headers.length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellRef]) continue;
      const isSpecial = specialCols.includes(c);
      ws[cellRef].s = {
        font: { sz: 10 },
        fill: isSpecial
          ? { patternType: 'solid', fgColor: { rgb: 'E2EFDA' } }
          : { patternType: 'none' },
        alignment: { horizontal: c === 0 ? 'left' : 'right' },
        border: thinBorder
      };
    }
  }

  // Style de la ligne de total (dernière ligne)
  const totalRowIndex = 2 + dataRows.length;
  for (let c = 0; c < headers.length; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: totalRowIndex, c });
    if (!ws[cellRef]) continue;
    const isSpecial = specialCols.includes(c);
    const cellStyle: any = {
      font: { bold: true, sz: 10 },
      fill: { patternType: 'solid', fgColor: { rgb: 'D9D9D9' } },
      alignment: { horizontal: c === 0 ? 'left' : 'right' },
      border: {
        top: { style: 'medium', color: { rgb: '000000' } },
        bottom: { style: 'medium', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      }
    };
    // Couleur pour la colonne rentabilité dans la ligne total
    if (c === rentabiliteCol) {
      const value = totalRentabilite;
      if (value > 0) cellStyle.font.color = { rgb: '00B050' };
      else if (value < 0) cellStyle.font.color = { rgb: 'FF0000' };
    }
    ws[cellRef].s = cellStyle;
  }


  // Largeurs des colonnes (inchangées)
  ws['!cols'] = [
    { wch: 9 }, { wch: 6 }, { wch: 6 }, { wch: 10 },
    { wch: 6 }, { wch: 10 }, { wch: 11 }, { wch: 16 },
    { wch: 16 }, { wch: 16 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 11 }, { wch: 14 }, { wch: 14 }, { wch: 14 }
  ];

  ws['!rows'] = [
    { hpt: 15 },
    { hpt: 40 },
    ...records.map(() => ({ hpt: 18 })),
    { hpt: 20 }   // hauteur de la ligne de total
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Feuil1');
  XLSX.writeFile(wb, `historique_${this.selectedProjetObj.nom}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
  loadPrevision(projetId: number): void {
    this.loadingPrevision = true;
    this.predictionIAService.getPrevisionMarge(projetId).subscribe({
      next: (data) => {
        this.previsionData = data;
        const predictions = data.predictions;

        this.lineChartData = {
          labels: predictions.map((p: any) => p.mois),
          datasets: [
            {
              label: ' Marge probable (€)',
              data: predictions.map((p: any) => p.marge_probable),
              borderColor: '#FF5722',
              backgroundColor: 'rgba(255, 87, 34, 0.1)',
              borderWidth: 3,
              tension: 0.4,
              pointRadius: 5,
              pointBackgroundColor: '#BF360C',
              fill: true,
              yAxisID: 'y'
            },
            {
              label: ' Probabilité de paiement',
              data: predictions.map((p: any) => p.prob_paiement),
              borderColor: '#FFC107',
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderDash: [5, 5],
              tension: 0.2,
              pointRadius: 4,
              pointBackgroundColor: '#FF9800',
              yAxisID: 'y1'
            }
          ]
        };

        const historique = data.historique;
        this.historyChartData = {
          labels: historique.map((h: any) => h.date),
          datasets: [
            {
              label: 'Rentabilité réelle (€)',
              data: historique.map((h: any) => h.rentabilite),
              borderColor: '#6FCF97',
              backgroundColor: 'rgba(111, 207, 151, 0.1)',
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#27AE60'
            },
            {
              label: 'Coût réel (€)',
              data: historique.map((h: any) => h.cout),
              borderColor: '#EB5757',
              backgroundColor: 'rgba(235, 87, 87, 0.08)',
              fill: false,
              tension: 0.4,
              pointBackgroundColor: '#C0392B'
            }
          ]
        };
        this.loadingPrevision = false;
      },
      error: (err) => {
        console.error(err);
        this.loadingPrevision = false;
      }
    });
  }

  setActiveTab(tab: 'historique' | 'previsions'): void {
    this.activeTab = tab;
    if (tab === 'previsions' && this.selectedProjetObj && !this.previsionData) {
      this.loadPrevision(this.selectedProjetObj.id);
    }
  }

  get avgProbabilite(): number {
    if (!this.previsionData?.predictions) return 0;
    const sum = this.previsionData.predictions.reduce((acc: number, p: any) => acc + p.prob_paiement, 0);
    return sum / this.previsionData.predictions.length;
  }

  get avgMargeProbable(): number {
    if (!this.previsionData?.predictions) return 0;
    const sum = this.previsionData.predictions.reduce((acc: number, p: any) => acc + p.marge_probable, 0);
    return sum / this.previsionData.predictions.length;
  }

  formatInterpretation(text: string): SafeHtml {
  if (!text) return '';
  // Optionnel : ajouter des classes supplémentaires aux balises existantes
  return this.sanitizer.bypassSecurityTrustHtml(text);
}
}
