import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FinanceDataService } from 'src/app/services/finance-data.service';
import { Projet, ProjetService } from 'src/app/services/projet.service';

interface ConseilIA {
  type: 'action' | 'alerte' | 'optimisation';
  titre: string;
  detail: string;
  priorite: 'haute' | 'moyenne' | 'faible';
}

interface SimulationResult {
  last_reel?: {
    tjm: number;
    jours: number;
    facture: number;
    cout: number;
    rentabilite: number;
  };
  last_ligne_simulee: {
    facture: number;
    cout: number;
    rentabilite: number;
    paye: number;
  };
  predictions: any[];
  metriques: {
    r2: number;
    mae: number;
    fiabilite: string;
    taux_paiement_historique: number;
  };
  profil_dt: {
    classe: 'RENTABLE' | 'FRAGILE' | 'EN_DANGER' | 'INCONNU';
    confiance: number;
    probas: Record<string, number>;
  };
  conseils_ia: {
    verdict?: 'positif' | 'négatif' | 'neutre';
    resume?: string;
    conseils?: ConseilIA[];
    conseil_tjm?: string | null;
    conseil_jours?: string | null;
    seuil_rentabilite?: string | null;
  };
}

@Component({
  selector: 'app-simulation',
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.css']
})
export class SimulationComponent implements OnInit {
  projets: Projet[] = [];
  selectedProjetId: number | null = null;
  selectedProjetNom: string = '';
  loadingProjets = false;
  loadingLastData = false;
  simulationRunning = false;

  currentValues = {
    tjm: 0, joursTravailles: 0, repasRestaurant: 0,
    totalNoteFrais: 0, totalNoteKilometrique: 0,
    paye: 0, facture: 0, cout: 0, rentabilite: 0
  };

  simParams = {
    tjm: null as number | null,
    jours_travailles: null as number | null,
    repas_restaurant: null as number | null,
    total_note_frais: null as number | null,
    total_note_kilometrique: null as number | null
  };

  simulationResult: SimulationResult | null = null;
  activeTab: 'resultats' | 'previsions' | 'conseils' | 'decision_tree' = 'resultats';

  constructor(
    private projetService: ProjetService,
    private financeService: FinanceDataService,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void { this.loadProjets(); }

  loadProjets() {
    this.loadingProjets = true;
    this.projetService.getProjets().subscribe({
      next: (data) => { this.projets = data; this.loadingProjets = false; },
      error: () => { this.loadingProjets = false; }
    });
  }

  onProjetChange() {
    if (!this.selectedProjetId) return;
    const p = this.projets.find(p => p.id === this.selectedProjetId);
    this.selectedProjetNom = p?.nom || '';
    this.simulationResult = null;
    this.activeTab = 'resultats';
    this.loadLastHistorique();
    this.resetSimulationForm();
  }

  loadLastHistorique() {
    this.loadingLastData = true;
    this.financeService.getHistoriques().subscribe({
      next: (historiques) => {
        const filtered = historiques
          .filter(h => h.projet_id === this.selectedProjetId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (filtered.length > 0) {
          const last = filtered[0];
          this.currentValues = {
            tjm: last.tjm || 0,
            joursTravailles: last.joursTravailles || 0,
            repasRestaurant: last.repasRestaurant || 0,
            totalNoteFrais: last.totalNoteFrais || 0,
            totalNoteKilometrique: last.totalNoteKilometrique || 0,
            paye: last.paye || 0,
            facture: last.facture || 0,
            cout: (last.salaireNetHorsRepas || 0) + (last.repasRestaurant || 0) + (last.totalNoteFrais || 0) + (last.totalNoteKilometrique || 0),
            rentabilite: last.rentabilite || 0
          };
          this.simParams.tjm = this.currentValues.tjm;
          this.simParams.jours_travailles = this.currentValues.joursTravailles;
          this.simParams.repas_restaurant = this.currentValues.repasRestaurant;
          this.simParams.total_note_frais = this.currentValues.totalNoteFrais;
          this.simParams.total_note_kilometrique = this.currentValues.totalNoteKilometrique;
        } else { this.resetCurrentValues(); }
        this.loadingLastData = false;
      },
      error: () => { this.loadingLastData = false; this.resetCurrentValues(); }
    });
  }

  resetCurrentValues() {
    this.currentValues = {
      tjm: 0, joursTravailles: 0, repasRestaurant: 0,
      totalNoteFrais: 0, totalNoteKilometrique: 0,
      paye: 0, facture: 0, cout: 0, rentabilite: 0
    };
  }

  resetSimulationForm() {
    this.simParams = {
      tjm: null, jours_travailles: null, repas_restaurant: null,
      total_note_frais: null, total_note_kilometrique: null
    };
  }

  runSimulation() {
    if (!this.selectedProjetId) return;
    this.simulationRunning = true;
    const payload: any = {};
    for (const [key, val] of Object.entries(this.simParams)) {
      if (val !== null && val !== undefined) payload[key] = val;
    }
    this.http.post<SimulationResult>(
      `http://localhost:8000/simulation/projet/${this.selectedProjetId}`,
      payload
    ).subscribe({
      next: (res) => {
        this.simulationResult = res;
        this.simulationRunning = false;
        this.activeTab = 'resultats';
      },
      error: (err) => { console.error(err); this.simulationRunning = false; }
    });
  }

  get deltaRentabilite(): number {
    if (!this.simulationResult) return 0;
    return this.simulationResult.last_ligne_simulee.rentabilite - (this.currentValues.rentabilite || 0);
  }

  get deltaFacture(): number {
    if (!this.simulationResult) return 0;
    return this.simulationResult.last_ligne_simulee.facture - (this.currentValues.facture || 0);
  }

  get marge3Mois(): number {
    if (!this.simulationResult?.predictions) return 0;
    return this.simulationResult.predictions.reduce((s, p) => s + (p.marge_probable || 0), 0);
  }

  get alerteGlobale(): boolean {
    return this.simulationResult?.predictions?.some(p => p.alerte === true) ?? false;
  }

  get verdictClass(): string {
    const v = this.simulationResult?.conseils_ia?.verdict;
    if (v === 'positif') return 'verdict-pos';
    if (v === 'négatif') return 'verdict-neg';
    return 'verdict-neu';
  }

  get verdictIcon(): string {
    const v = this.simulationResult?.conseils_ia?.verdict;
    if (v === 'positif') return '↑';
    if (v === 'négatif') return '↓';
    return '→';
  }

  conseilIcon(type: string): string {
    if (type === 'alerte') return '⚠';
    if (type === 'action') return '▶';
    return '◆';
  }

  prioriteClass(p: string): string {
    if (p === 'haute') return 'prio-haute';
    if (p === 'moyenne') return 'prio-moyenne';
    return 'prio-faible';
  }

  probBarWidth(prob: number): string {
    return `${Math.round(prob * 100)}%`;
  }

  getMaxValue(reel: number, sim: number): number {
    return Math.max(Math.abs(reel), Math.abs(sim), 1);
  }

  getBarWidth(reel: number, sim: number, value: number): string {
    return (Math.abs(value) / this.getMaxValue(reel, sim) * 100) + '%';
  }

  formatInterpretation(text: string): SafeHtml {
    if (!text) return '';
    const formatted = text
      .replace(/\b(hausse|augmentation|positive|bénéfice)\b/gi, m => `<span class="text-positive">${m}</span>`)
      .replace(/\b(baisse|diminution|négative|perte|risque|alerte)\b/gi, m => `<span class="text-negative">${m}</span>`)
      .replace(/\b(\d+(?:[.,]\d+)?\s?%|\d+(?:[.,]\d+)?\s?€)\b/gi, m => `<span class="text-highlight">${m}</span>`);
    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }

  // Decision Tree helpers
  get dtClasseCss(): string {
    const c = this.simulationResult?.profil_dt?.classe;
    if (c === 'RENTABLE') return 'dt-rentable';
    if (c === 'EN_DANGER') return 'dt-danger';
    if (c === 'FRAGILE') return 'dt-fragile';
    return 'dt-inconnu';
  }

  get dtClasseIcon(): string {
    const c = this.simulationResult?.profil_dt?.classe;
    if (c === 'RENTABLE') return '✦';
    if (c === 'EN_DANGER') return '⚠';
    if (c === 'FRAGILE') return '◈';
    return '?';
  }

  get probasArray(): { classe: string; prob: number; pct: number }[] {
    const probas = this.simulationResult?.profil_dt?.probas;
    if (!probas) return [];
    return Object.entries(probas)
      .map(([classe, prob]) => ({ classe, prob: prob as number, pct: Math.round((prob as number) * 100) }))
      .sort((a, b) => b.prob - a.prob);
  }

  probaClasseCss(classe: string): string {
    if (classe === 'RENTABLE') return 'dt-rentable';
    if (classe === 'EN_DANGER') return 'dt-danger';
    if (classe === 'FRAGILE') return 'dt-fragile';
    return '';
  }

  probaFillCss(classe: string): string {
    if (classe === 'RENTABLE') return 'fill-rentable';
    if (classe === 'EN_DANGER') return 'fill-danger';
    if (classe === 'FRAGILE') return 'fill-fragile';
    return '';
  }
}
