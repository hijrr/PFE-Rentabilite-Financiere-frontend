import { Component, OnInit } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { DashboardService } from 'src/app/services/dashboard.service';

@Component({
  selector: 'app-page-main',
  templateUrl: './page-main.component.html',
  styleUrls: ['./page-main.component.css']
})
export class PageMainComponent implements OnInit {

  // ─── Palette de couleurs mates ──────────────────────────
  private readonly mattePalette = {
    blueSoft:   '#6B9AC4',
    lavender:   '#A28FCE',
    peach:      '#F4A28C',
    coral:      '#E28B7A',
    sand:       '#E2C28B',
    rose:       '#D9A5B3',
    indigo:     '#7B8DBD',
    apricot:    '#F0B27A',
    lineBlue:   '#6B9AC4',
    lineFill:   'rgba(107, 154, 196, 0.08)',
    pointBlue:  '#4A7AA4'
  };

  // ─── KPIs ───────────────────────────────────────────────
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

  // ─── Données graphiques ──────────────────────────────────
  tjmChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  topClientsChartData: ChartConfiguration<'pie'>['data'] = { labels: [], datasets: [] };
  rentabiliteSalarieChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  topProjetsChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  evolutionCAChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  projetsStatutChartData: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };

  // ─── Nouvelles données ───────────────────────────────────
  facturesImpayees: any[] = [];
  projetsStatutPaiement: any[] = [];

  // ─── Filtre année ───────────────────────────────────────
  availableYears: number[] = [];
  selectedYear: number | null = null;

  // ─── Options des graphiques ──────────────────────────────
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true, ticks: { callback: (val: string | number) => val + ' €' } } }
  };

  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } }
  };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: { callbacks: { label: (ctx: any) => ctx.raw + ' €' } }
    },
    scales: { y: { ticks: { callback: (val: string | number) => val + ' €' } } }
  };

  doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxHeight: 6, padding: 16 } }
    }
  };

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.initYearFilter();
    this.loadTjmSalaries();
    this.loadTopClients();
    this.loadRentabiliteParSalarie();
    this.loadTop3Projets();
    this.loadGlobalMetrics();
    this.loadMargeMoyenne();
    this.loadEvolutionCA();
    this.loadFacturesImpayees();
    this.loadProjetsStatutPaiement();
  }

  // ─── Initialisation des années pour le filtre ────────────
  initYearFilter(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 4; i--) {
      this.availableYears.push(i);
    }
  }

  // ─── Chargement des données ──────────────────────────────
  loadTjmSalaries(): void {
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

  loadTopClients(): void {
    this.dashboardService.getTopClients().subscribe(data => {
      this.bestClient = data.length ? data[0].client : '';
      this.bestClientCA = data.length ? data[0].ca : 0;
      const pieColors = [this.mattePalette.blueSoft, this.mattePalette.lavender, this.mattePalette.peach,
                         this.mattePalette.coral, this.mattePalette.sand, this.mattePalette.rose];
      this.topClientsChartData = {
        labels: data.map((d: any) => d.client),
        datasets: [{ data: data.map((d: any) => d.ca), backgroundColor: pieColors.slice(0, data.length) }]
      };
    });
  }

  loadRentabiliteParSalarie(): void {
    this.dashboardService.getRentabiliteParSalarie().subscribe(data => {
      const top = data.slice(0, 3);
      this.rentabiliteSalarieChartData = {
        labels: top.map((d: any) => d.nom),
        datasets: [{
          data: top.map((d: any) => d.rentabilite),
          label: 'Rentabilité (€)',
          backgroundColor: [this.mattePalette.blueSoft, this.mattePalette.lavender, this.mattePalette.peach],
          borderRadius: 8
        }]
      };
    });
  }

  loadTop3Projets(): void {
    this.dashboardService.getTopProjets().subscribe(data => {
      const top = data.slice(0, 3);
      this.topProjetRentable = top.length ? top[0].nom : '';
      this.topProjetRentableValue = top.length ? top[0].rentabilite_totale : 0;
      this.topProjetsChartData = {
        labels: top.map((d: any) => d.nom),
        datasets: [{
          data: top.map((d: any) => d.rentabilite_totale),
          label: 'Rentabilité (€)',
          backgroundColor: [this.mattePalette.coral, this.mattePalette.sand, this.mattePalette.rose],
          borderRadius: 8
        }]
      };
    });
  }

  loadGlobalMetrics(): void {
    this.dashboardService.getGlobalKPI().subscribe(data => {
      this.totalOperations = data.total_operations;
      this.rentabiliteTotal = data.rentabilite_total;
      this.avgTjm = Math.round(data.avg_tjm);
    });
  }

  loadMargeMoyenne(): void {
    this.dashboardService.getmargemoyen().subscribe(data => {
      this.avgmarge = data.marge_moyenne || 0;
    });
  }

  loadEvolutionCA(): void {
    this.dashboardService.getEvolutionCA(this.selectedYear || undefined).subscribe(data => {
      this.evolutionCAChartData = {
        labels: data.map((d: any) => d.mois),
        datasets: [{
          data: data.map((d: any) => d.ca),
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

  // ─── Nouvelles méthodes ─────────────────────────────────
  loadFacturesImpayees(): void {
    this.dashboardService.getDashboardFacturesImpayees(6).subscribe({
      next: (data) => {
        this.facturesImpayees = data || [];
      },
      error: (err) => console.error('Erreur chargement factures impayées', err)
    });
  }

  loadProjetsStatutPaiement(): void {
    this.dashboardService.getDashboardProjetsStatutPaiement().subscribe({
      next: (data) => {
        this.projetsStatutPaiement = data || [];
        this.buildProjetsStatutChart();
      },
      error: (err) => console.error('Erreur chargement statut paiement projets', err)
    });
  }

  buildProjetsStatutChart(): void {
    const labels = this.projetsStatutPaiement.map(item => this.paymentLabel(item.status_paiement));
    const values = this.projetsStatutPaiement.map(item => item.nombre);
    this.projetsStatutChartData = {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: [this.mattePalette.blueSoft, this.mattePalette.coral, this.mattePalette.sand, this.mattePalette.lavender]
      }]
    };
  }

  // ─── Helpers ────────────────────────────────────────────
  onYearFilterChange(): void {
    this.loadEvolutionCA();
  }

  resetYearFilter(): void {
    this.selectedYear = null;
    this.loadEvolutionCA();
  }

  paymentLabel(value: string | null | undefined): string {
    if (!value || value === 'non_renseigne') return 'Non renseigné';
    if (value === 'paye' || value === '1') return 'Payé';
    if (value === 'non_paye' || value === '0') return 'Non payé';
    if (value === 'partiel') return 'Partiel';
    return value.replace(/_/g, ' ');
  }

  formatDate(timestamp: number | string | null): string {
    if (!timestamp) return 'Non renseignée';
    const ts = typeof timestamp === 'number' ? timestamp * 1000 : Number(timestamp) * 1000;
    if (!isNaN(ts)) return new Date(ts).toLocaleDateString('fr-FR');
    return String(timestamp);
  }
}
