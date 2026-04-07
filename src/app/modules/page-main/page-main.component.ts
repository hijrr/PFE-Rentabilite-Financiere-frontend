import { Component, OnInit } from '@angular/core';
import Chart, { ChartConfiguration } from 'chart.js/auto';
import { DashboardService } from 'src/app/services/dashboard.service';

@Component({
  selector: 'app-page-main',
  templateUrl: './page-main.component.html',
  styleUrls: ['./page-main.component.css']
})
export class PageMainComponent implements OnInit {

  barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'top' } },
    scales: { y: { beginAtZero: true } }
  };

  pieChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'right' } }
  };

  // Données
  tjmSalariesData: any[] = [];
  topClientsData: any[] = [];
  rentabiliteSalarieData: any[] = [];
  topProjetsData: any[] = [];

  // Charts
  tjmChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  topClientsChartData: ChartConfiguration<'pie'>['data'] = { labels: [], datasets: [] };
  rentabiliteSalarieChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  topProjetsChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadTjmSalaries();
    this.loadTopClients();
    this.loadRentabiliteParSalarie();
    this.loadTop3Projets();
  }

  loadTjmSalaries() {
    this.dashboardService.getTjmSalaries().subscribe(data => {
      const top3 = data.sort((a: { tjm: number }, b: { tjm: number }) => b.tjm - a.tjm).slice(0, 3);
      this.tjmChartData = {
        labels: top3.map((d: { salarie: string }) => d.salarie),
        datasets: [{
          data: top3.map((d: { tjm: number }) => d.tjm),
          label: 'TJM (€)',
          // Couleurs vives (orange, rouge, magenta)
          backgroundColor: ['#FF6B6B', '#FF8E53', '#FF4B2B'],
          borderRadius: 8
        }]
      };
    });
  }

  loadTopClients() {
    this.dashboardService.getTopClients().subscribe(data => {
      // Palette vive (non verte)
      const vividColors = ['#FF5252', '#FF9800', '#FFC107', '#E040FB', '#00BCD4', '#F44336', '#FF4081', '#3F51B5', '#FFB300', '#9C27B0'];
      this.topClientsChartData = {
        labels: data.map((d: { client: any; }) => d.client),
        datasets: [{
          data: data.map((d: { ca: any; }) => d.ca),
          backgroundColor: vividColors.slice(0, data.length)
        }]
      };
    });
  }

  loadRentabiliteParSalarie() {
    this.dashboardService.getRentabiliteParSalarie().subscribe(data => {
      this.rentabiliteSalarieChartData = {
        labels: data.slice(0,3).map(d => d.nom),
        datasets: [{
          data: data.slice(0,3).map(d => d.rentabilite),
          label: 'Rentabilité (€)',
          // Jaune, orange, rouge vif
          backgroundColor: ['#FFC107', '#FF9800', '#F44336'],
          borderRadius: 8
        }]
      };
    });
  }

  loadTop3Projets() {
    this.dashboardService.getTop3ProjetsRentables().subscribe(data => {
      this.topProjetsChartData = {
        labels: data.map(d => d.nom),
        datasets: [{
          data: data.map(d => d.rentabilite_totale),
          label: 'Rentabilité (€)',
          // Bleu, violet, rose
          backgroundColor: ['#2196F3', '#9C27B0', '#FF4081'],
          borderRadius: 8
        }]
      };
    });
  }
}
