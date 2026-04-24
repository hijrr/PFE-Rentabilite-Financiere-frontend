import { Component, OnInit } from '@angular/core';
import { PredictionIAService } from 'src/app/services/prediction-ia.service';

@Component({
  selector: 'app-prediction-ia',
  templateUrl: './prediction-ia.component.html',
  styleUrls: ['./prediction-ia.component.css']
})
export class PredictionIAComponent implements OnInit {
  data: any;
  mois: number = 6;

  // CHART DATA
  chartLabels: string[] = [];
  margeData: number[] = [];
  coutData: number[] = [];
  factureData: number[] = [];

  // Chart options (déplacées ici)
  chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (tooltipItem: any) => {
            return tooltipItem.raw + ' €';
          }
        }
      }
    }
  };

  constructor(private predictionService: PredictionIAService) { }

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.predictionService.getDashboardIA(this.mois).subscribe({
      next: (res) => {
        this.data = res;
        this.buildChart(res);
      },
      error: (err) => {
        console.error('Erreur dashboard:', err);
      }
    });
  }

  buildChart(res: any): void {
    this.chartLabels = res.evolution.map((e: any) => e.mois);
    this.margeData = res.evolution.map((e: any) => e.marge);
    this.coutData = res.evolution.map((e: any) => e.cout);
    this.factureData = res.evolution.map((e: any) => e.facture);
  }

  changeMois(m: number): void {
    this.mois = m;
    this.loadDashboard();
  }

  isDanger(projet: any): boolean {
    return projet.alerte === true;
  }
}
