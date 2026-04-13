import { Component, OnInit } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { DashboardService } from 'src/app/services/dashboard.service';

@Component({
  selector: 'app-page-main',
  templateUrl: './page-main.component.html',
  styleUrls: ['./page-main.component.css']
})
export class PageMainComponent implements OnInit {
  // Options des graphiques
  barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true, ticks: { callback: (val: number) => val + ' €' } } }
  };
  pieChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } }
  };
  lineChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: (ctx: any) => ctx.raw + ' €' } } },
    scales: { y: { ticks: { callback: (val: number) => val + ' €' } } }
  };

  // KPIs
  totalSalaries = 0;
  avgTjm = 0;
  avgmarge = 0;
  totalOperations = 0;
  rentabiliteTotal = 0;
  bestClient = '';
  bestClientCA = 0;
  topTjmSalarie = '';
  topProjetRentable = '';
  topProjetRentableValue = 0;

  // Données graphiques
  tjmChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  topClientsChartData: ChartConfiguration<'pie'>['data'] = { labels: [], datasets: [] };
  rentabiliteSalarieChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  topProjetsChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  evolutionCAChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };

  // Filtre année pour le graphique CA
  availableYears: number[] = [];
  selectedYear: number | null = null;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadTjmSalaries();
    this.loadTopClients();
    this.loadRentabiliteParSalarie();
    this.loadTop3Projets();
    this.loadGlobalMetrics();
    this.loadMargeMoyenne();
    this.loadEvolutionCA();
    this.initYearFilter();
  }

  initYearFilter() {
    // Générer les 5 dernières années
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 4; i--) {
      this.availableYears.push(i);
    }
  }

  loadTjmSalaries() {
    this.dashboardService.getTjmSalaries().subscribe(data => {
      this.totalSalaries = data.length;
      const totalTjm = data.reduce((sum: number, item: any) => sum + (item.tjm || 0), 0);
      this.avgTjm = this.totalSalaries ? Math.round(totalTjm / this.totalSalaries) : 0;
      const top3 = [...data].sort((a, b) => b.tjm - a.tjm).slice(0, 3);
      this.topTjmSalarie = top3.length ? top3[0].salarie : '';
      this.tjmChartData = {
        labels: top3.map(d => d.salarie),
        datasets: [{ data: top3.map(d => d.tjm), label: 'TJM (€)', backgroundColor: ['#FF6B6B', '#FF8E53', '#FF4B2B'], borderRadius: 8 }]
      };
    });
  }

  loadTopClients() {
    this.dashboardService.getTopClients().subscribe(data => {
      this.bestClient = data.length ? data[0].client : '';
      this.bestClientCA = data.length ? data[0].ca : 0;
      const colors = ['#FF5252', '#FF9800', '#FFC107', '#E040FB', '#00BCD4', '#F44336', '#FF4081', '#3F51B5', '#FFB300', '#9C27B0'];
      this.topClientsChartData = {
        labels: data.map((d:any) => d.client),
        datasets: [{ data: data.map((d:any) => d.ca), backgroundColor: colors.slice(0, data.length) }]
      };
    });
  }

  loadRentabiliteParSalarie() {
    this.dashboardService.getRentabiliteParSalarie().subscribe(data => {
      const top = data.slice(0, 3);
      this.rentabiliteSalarieChartData = {
        labels: top.map((d:any) => d.nom),
        datasets: [{ data: top.map((d:any) => d.rentabilite), label: 'Rentabilité (€)', backgroundColor: ['#FFC107', '#FF9800', '#F44336'], borderRadius: 8 }]
      };
    });
  }

  loadTop3Projets() {
    this.dashboardService.getTopProjets().subscribe(data => {
      const top = data.slice(0, 3);
      this.topProjetRentable = top.length ? top[0].nom : '';
      this.topProjetRentableValue = top.length ? top[0].rentabilite_totale : 0;
      this.topProjetsChartData = {
        labels: top.map((d:any) => d.nom),
        datasets: [{ data: top.map((d:any) => d.rentabilite_totale), label: 'Rentabilité (€)', backgroundColor: ['#2196F3', '#9C27B0', '#FF4081'], borderRadius: 8 }]
      };
    });
  }

  loadGlobalMetrics() {
    this.dashboardService.getGlobalKPI().subscribe(data => {
      this.totalOperations = data.total_operations;
      this.rentabiliteTotal = data.rentabilite_total;
      this.avgTjm = Math.round(data.avg_tjm);
    });
  }

  loadMargeMoyenne() {
    this.dashboardService.getmargemoyen().subscribe(data => {
      this.avgmarge = data.marge_moyenne || 0;
    });
  }

  loadEvolutionCA() {
    this.dashboardService.getEvolutionCA(this.selectedYear || undefined).subscribe(data => {
      this.evolutionCAChartData = {
        labels: data.map((d:any) => d.mois),
        datasets: [{
          data: data.map((d:any) => d.ca),
          label: 'Chiffre d\'affaires (€)',
          borderColor: '#6FCF97',
          backgroundColor: 'rgba(111, 207, 151, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#27AE60'
        }]
      };
    });
  }

  onYearFilterChange() {
    this.loadEvolutionCA();
  }

  resetYearFilter() {
    this.selectedYear = null;
    this.loadEvolutionCA();
  }
}
