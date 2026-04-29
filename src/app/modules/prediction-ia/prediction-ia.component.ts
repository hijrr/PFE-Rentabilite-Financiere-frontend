import { Component, OnInit } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { PredictionIAService } from 'src/app/services/prediction-ia.service';

@Component({
  selector: 'app-prediction-ia',
  templateUrl: './prediction-ia.component.html',
  styleUrls: ['./prediction-ia.component.css']
})
export class PredictionIAComponent implements OnInit {

  // ── State ──────────────────────────────────────────
  data: any = null;
  mois: number = 3;
  loading = false;
  activeView: 'chart' | 'projets' = 'chart';

  // ── Chart ──────────────────────────────────────────
  chartLabels: string[] = [];
  margeData: number[]   = [];
  coutData: number[]    = [];
  factureData: number[] = [];

  lineChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
  usePointStyle: true,
  boxHeight: 6,
  padding: 20,
  font: { size: 12 }
}
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#94a3b8',
        bodyColor: '#f1f5f9',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.raw.toLocaleString('fr-FR')} €`
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(100,116,139,0.08)' },
        ticks: { color: '#94a3b8', font: { size: 11 } }
      },
      y: {
        grid: { color: 'rgba(100,116,139,0.08)' },
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
          callback: (val: any) => val.toLocaleString('fr-FR') + ' €'
        }
      }
    },
    elements: {
      point: { radius: 4, hoverRadius: 7 }
    }
  };

  // ── Analyse courbe computed ─────────────────────────
  get analyseCourbe(): any  { return this.data?.analyse_courbe || {}; }
  get analyseIA(): string   { return this.data?.analyse_ia || ''; }
  get kpis(): any           { return this.data?.kpis || {}; }
  get projets(): any[]      { return this.data?.projets || []; }
  get evolution(): any[]    { return this.data?.evolution || []; }
  get hasAlert(): boolean   { return (this.kpis.projets_en_risque ?? 0) > 0; }

  get riskClass(): string {
    const r = this.analyseCourbe.risk_level;
    if (r === 'ÉLEVÉ')  return 'risk-high';
    if (r === 'MODÉRÉ') return 'risk-med';
    return 'risk-low';
  }

  get tendanceIcon(): string {
    const t = this.analyseCourbe.tendance;
    if (t === 'hausse') return '↗';
    if (t === 'baisse') return '↘';
    return '→';
  }

  get tendanceClass(): string {
    const t = this.analyseCourbe.tendance;
    if (t === 'hausse') return 'pos';
    if (t === 'baisse') return 'neg';
    return 'neutral';
  }

  get projetsDanger(): any[] {
    return this.projets.filter(p => p.alerte);
  }

  get projetsSains(): any[] {
    return this.projets.filter(p => !p.alerte);
  }

  // Barre de marge relative max pour les barres projets
  get margeMax(): number {
    return Math.max(...this.projets.map(p => Math.abs(p.marge_moyenne)), 1);
  }

  constructor(private predictionService: PredictionIAService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.predictionService.getDashboardIA(this.mois).subscribe({
      next: (res) => {
        this.data = res;
        this.buildChart(res);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur dashboard:', err);
        this.loading = false;
      }
    });
  }

  buildChart(res: any): void {
    const ev = res.evolution || [];
    this.lineChartData = {
      labels: ev.map((e: any) => e.mois),
      datasets: [
        {
          label: 'Marge nette',
          data: ev.map((e: any) => e.marge),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.08)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.45,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
        {
          label: 'Coût total',
          data: ev.map((e: any) => e.cout),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.06)',
          borderWidth: 2,
          fill: false,
          tension: 0.45,
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ]
    };
  }

  changeMois(m: number): void {
    if (this.mois === m) return;
    this.mois = m;
    this.loadDashboard();
  }

  setView(v: 'chart' | 'projets'): void {
    this.activeView = v;
  }

  isDanger(p: any): boolean {
    return p.alerte === true;
  }

  barWidth(marge: number): number {
    return Math.round((Math.abs(marge) / this.margeMax) * 100);
  }

  formatEur(n: number): string {
    if (n == null) return '—';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  }
}
