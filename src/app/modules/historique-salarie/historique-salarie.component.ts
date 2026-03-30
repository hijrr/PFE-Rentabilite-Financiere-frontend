import { Component, OnInit } from '@angular/core';
import { FinanceDataService } from 'src/app/services/finance-data.service';
import { SalarieServiceService } from 'src/app/services/salarie-service.service';

@Component({
  selector: 'app-historique-salarie',
  templateUrl: './historique-salarie.component.html',
  styleUrls: ['./historique-salarie.component.css']
})
export class HistoriqueSalarieComponent implements OnInit {

  constructor(private salarieService: SalarieServiceService,private financeDataService: FinanceDataService) { }
   allHistoriques: any[] = [];
salaries:any[]=[];
historiqueData: any;
dolibarData: any;
selectedSalarie: any = null;
 filteredHistoriques: any[] = []; // Historique du salarié sélectionné
  searchTerm: string = '';
   isLoading = false;
   timelineData: Array<{ year: string; months: Array<{ name: string; records: any[] }> }> = [];
  // Filtre de recherche
  ngOnInit(): void {
    this.loadSalaries();
    this.loadHistoriques();
  }
 loadSalaries(): void {
  this.isLoading = true;
    this.salarieService.getSalaries().subscribe({
      next: (data) => {
        this.isLoading = false;
        this.salaries = data || [];
        console.log('Salariés chargés:', this.salaries);
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
      }
    });
  }
  loadHistoriques(): void {
    this.financeDataService.getHistoriques().subscribe({
      next: (data) => {
        this.allHistoriques = data || [];
        // Si un salarié est déjà sélectionné, on met à jour son historique
        if (this.selectedSalarie) {
          this.filterHistoriquesBySalarie(this.selectedSalarie);
        }
      },
      error: (err) => console.error('Erreur chargement historiques', err)
    });
  }
  filterHistoriquesBySalarie(salarie: any): void {
    this.filteredHistoriques = this.allHistoriques.filter(h => h.salarie_id === salarie.id);
      this.updateTimelineData();
  }

  // Sélection d'un salarié
  selectSalarie(salarie: any): void {
    this.selectedSalarie = salarie;
    this.filterHistoriquesBySalarie(salarie);
  }
   get filteredSalaries(): any[] {
    if (!this.searchTerm) return this.salaries;
    const term = this.searchTerm.toLowerCase();
    return this.salaries.filter(s =>
      s.username.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term) ||
      s.role.toLowerCase().includes(term)
    );
  }
   get totalRecords(): number {
    return this.filteredHistoriques.length;
  }

  get totalSalary(): number {
    return this.filteredHistoriques.reduce((sum, r) => sum + (r.salaireBrut || 0), 0);
  }

  get totalFacture(): number {
    return this.filteredHistoriques.reduce((sum, r) => sum + (r.facture || 0), 0);
  }

  get totalRentabilite(): number {
    return this.filteredHistoriques.reduce((sum, r) => sum + (r.rentabilite || 0), 0);
  }

  updateTimelineData() {
    const groups: { [year: string]: { [month: string]: any[] } } = {};
    for (const record of this.filteredHistoriques) {
      const date = new Date(record.date);
      const year = date.getFullYear().toString();
      const month = date.getMonth(); // 0-11
      if (!groups[year]) groups[year] = {};
      if (!groups[year][month]) groups[year][month] = [];
      groups[year][month].push(record);
    }

    const result: Array<{ year: string; months: Array<{ name: string; records: any[] }> }> = [];
    const years = Object.keys(groups).sort().reverse(); // années décroissantes
    for (const year of years) {
      const monthsList: Array<{ name: string; records: any[] }> = [];
      const monthNumbers = Object.keys(groups[year]).map(Number).sort((a, b) => b - a); // mois décroissants
      for (const monthNum of monthNumbers) {
        monthsList.push({
          name: new Date(2000, monthNum, 1).toLocaleString('fr-FR', { month: 'long' }),
          records: groups[year][monthNum]
        });
      }
      result.push({ year, months: monthsList });
    }
    this.timelineData = result;
  }


  profitPercent(record: any): number {
    const facture = record.facture || 0;
    if (facture === 0) return 0;
    const profit = record.rentabilite || 0;
    const ratio = (profit / facture) * 100;
    return Math.min(Math.max(ratio, 0), 100); // entre 0 et 100%
  }
}
