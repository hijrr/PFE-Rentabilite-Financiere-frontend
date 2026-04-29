import { Component, OnInit } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { DashboardService } from 'src/app/services/dashboard.service';

@Component({
  selector: 'app-page-main',
  templateUrl: './page-main.component.html',
  styleUrls: ['./page-main.component.css']
})
export class PageMainComponent implements OnInit {
  // Définissez une palette unique réutilisable (dans la classe, avant les méthodes)
private readonly mattePalette = {
  // Barres / secteurs
  blueSoft:     '#6B9AC4',   // bleu doux
  lavender:     '#A28FCE',   // lavande
  peach:        '#F4A28C',   // pêche
  coral:        '#E28B7A',   // corail terreux
  sand:         '#E2C28B',   // sable doré
  rose:         '#D9A5B3',   // rose poudré
  indigo:       '#7B8DBD',   // indigo clair
  apricot:      '#F0B27A',   // abricot
  // Pour la ligne
  lineBlue:     '#6B9AC4',
  lineFill:     'rgba(107, 154, 196, 0.08)',
  pointBlue:    '#4A7AA4'
};

// Puis dans chaque méthode de chargement, utilisez ces couleurs :
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
      datasets: [{
        data: top3.map(d => d.tjm),
        label: 'TJM (€)',
        backgroundColor: [this.mattePalette.blueSoft, this.mattePalette.lavender, this.mattePalette.peach],
        borderRadius: 8
      }]
    };
  });
}

 loadTopClients() {
  this.dashboardService.getTopClients().subscribe(data => {
    this.bestClient = data.length ? data[0].client : '';
    this.bestClientCA = data.length ? data[0].ca : 0;
    const pieColors = [this.mattePalette.blueSoft, this.mattePalette.lavender, this.mattePalette.peach,
                       this.mattePalette.coral, this.mattePalette.sand, this.mattePalette.rose];
    this.topClientsChartData = {
      labels: data.map((d:any) => d.client),
      datasets: [{ data: data.map((d:any) => d.ca), backgroundColor: pieColors.slice(0, data.length) }]
    };
  });
}
 loadRentabiliteParSalarie() {
  this.dashboardService.getRentabiliteParSalarie().subscribe(data => {
    const top = data.slice(0, 3);
    this.rentabiliteSalarieChartData = {
      labels: top.map((d:any) => d.nom),
      datasets: [{
        data: top.map((d:any) => d.rentabilite),
        label: 'Rentabilité (€)',
        backgroundColor: [this.mattePalette.blueSoft, this.mattePalette.lavender, this.mattePalette.peach],
        borderRadius: 8
      }]
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
      datasets: [{
        data: top.map((d:any) => d.rentabilite_totale),
        label: 'Rentabilité (€)',
        backgroundColor: [this.mattePalette.coral, this.mattePalette.sand, this.mattePalette.rose],
        borderRadius: 8
      }]
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
        borderColor: this.mattePalette.lineBlue,
        backgroundColor: this.mattePalette.lineFill,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: this.mattePalette.pointBlue,
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 1.5,
        pointRadius: 4,
        pointHoverRadius: 6
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
