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

// Nouvelle structure exacte du backend
interface SimulationResult {
  last_reel?: {
    tjm: number;
    jours: number;
    repas: number;
    note_frais: number;
    note_kilo: number;
    net_payer: number;
    snhr: number;
    facture: number;
    cout: number;
    rentabilite: number;
  };
  simulation: {
    facture_brute: number;   // tjm × jours
    facture_sim: number;     // facture_brute * paye (0 si non payé)
    cout: number;
    net_hors_repas: number;
    rentabilite: number;
  };
  predictions: any[];
  metriques: {
    r2: number;
    mae: number;
    fiabilite: string;
    taux_paiement_historique: number;
  };
  profil_dt: {
    // Cas si le mois est payé
    cas_paye: {
      classe: 'BON_MOIS' | 'MOYEN_MOIS' | 'MAUVAIS_MOIS';
      confiance: number;
      probas: Record<string, number>;
      rentabilite: number;
      totaleFacture: number;
    };
    // Cas si le mois n'est pas payé
    cas_non_paye: {
      classe: 'BON_MOIS' | 'MOYEN_MOIS' | 'MAUVAIS_MOIS';
      confiance: number;
      probas: Record<string, number>;
      rentabilite: number;
      totaleFacture: number;
    };
    facture_brute: number;
    cout_sim: number;
    impact_non_paye: number;
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

  resetCurrentValues() { /* ... identique ... */ }
  resetSimulationForm() { /* ... identique ... */ }

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

  // ─── Getter adaptés à la nouvelle structure ─────────────
  get deltaRentabilite(): number {
  if (!this.simulationResult) return 0;
  return this.simulationResult.simulation.rentabilite - (this.currentValues.rentabilite || 0);
}

get deltaFacture(): number {
  if (!this.simulationResult) return 0;
  return this.simulationResult.simulation.facture_sim - (this.currentValues.facture || 0);
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

  // ─── NOUVEAUX GETTERS pour l’onglet Decision Tree ───────
  // Classe du cas payé (affichage principal)
  get dtClasse(): string {
    return this.simulationResult?.profil_dt?.cas_paye?.classe || 'INCONNU';
  }

  get dtConfiance(): number {
    return this.simulationResult?.profil_dt?.cas_paye?.confiance || 0;
  }

  get dtClasseCss(): string {
    const c = this.dtClasse;
    if (c === 'BON_MOIS') return 'dt-rentable';
    if (c === 'MAUVAIS_MOIS') return 'dt-danger';
    return 'dt-fragile';
  }

  get dtClasseIcon(): string {
    const c = this.dtClasse;
    if (c === 'BON_MOIS') return '✦';
    if (c === 'MAUVAIS_MOIS') return '⚠';
    return '◈';
  }

  // Probabilités (cas payé)
  get probasArray(): { classe: string; prob: number; pct: number }[] {
    const probas = this.simulationResult?.profil_dt?.cas_paye?.probas;
    if (!probas) return [];
    return Object.entries(probas)
      .map(([classe, prob]) => ({ classe, prob: prob as number, pct: Math.round((prob as number) * 100) }))
      .sort((a, b) => b.prob - a.prob);
  }

  probaClasseCss(classe: string): string {
    if (classe === 'BON_MOIS') return 'dt-rentable';
    if (classe === 'MAUVAIS_MOIS') return 'dt-danger';
    return 'dt-fragile';
  }

  probaFillCss(classe: string): string {
    if (classe === 'BON_MOIS') return 'fill-rentable';
    if (classe === 'MAUVAIS_MOIS') return 'fill-danger';
    return 'fill-fragile';
  }
}
