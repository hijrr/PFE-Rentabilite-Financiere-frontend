import { Component, OnInit } from '@angular/core';
import { FinanceDataService } from 'src/app/services/finance-data.service';
import { Projet, ProjetService } from 'src/app/services/projet.service';
import { SimulationParams, SimulationService } from 'src/app/services/simulation.service';

type ClasseMois = 'BON_MOIS' | 'MOYEN_MOIS' | 'MAUVAIS_MOIS' | string;
type ActiveTab = 'reel' | 'simulation';

interface ConseilIA {
  type: 'action' | 'alerte' | 'optimisation' | string;
  titre: string;
  detail: string;
  priorite: 'haute' | 'moyenne' | 'faible' | string;
}

interface LastReel {
  tjm: number;
  jours: number;
  repas: number;
  note_frais: number;
  note_kilo: number;
  net_avant_impot?: number;
  salaire_net_hors_repas: number;
  facture: number;
  cout: number;
  rentabilite: number;
  paye?: number | boolean | string;
}

interface SimulationData {
  facture_brute: number;
  facture_sim: number;
  cout: number;
  salaire_net_hors_repas: number;
  net_hors_repas: number;
  total_percu: number;
  rentabilite: number;
  rent_paye: number;
  rent_non_paye: number;
  seuils?: {
    tjm_min_rentable?: number | null;
    tjm_min_bon_mois?: number | null;
    jours_min_rentable?: number | null;
    jours_min_bon_mois?: number | null;
  };
}

interface ClassificationCas {
  classe_ml: ClasseMois | null;
  confiance: number;
  probas: Record<string, number>;
  rentabilite: number;
  totaleFacture: number;
}

interface ProfilGaussian {
  cas_paye: ClassificationCas;
  cas_non_paye: ClassificationCas;
  facture_brute: number;
  cout_sim: number;
  salaire_net_hors_repas: number;
  frais_total: number;
}

interface ConseilsIAResponse {
  verdict?: 'positif' | 'négatif' | 'negatif' | 'neutre' | string;
  resume?: string;
  conseils?: ConseilIA[];
  conseil_tjm?: string | null;
  conseil_jours?: string | null;
  seuil_rentabilite?: string | null;
}

interface SimulationResult {
  last_reel: LastReel;
  simulation: SimulationData;
  profil_dt: ProfilGaussian;
  conseils_ia: ConseilsIAResponse;
}

interface CurrentValues {
  tjm: number;
  joursTravailles: number;
  repasRestaurant: number;
  totalNoteFrais: number;
  totalNoteKilometrique: number;
  paye: number | boolean | string | null;
  facture: number;
  cout: number;
  rentabilite: number;
  salaireNetHorsRepas: number;
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
  errorMessage = '';

  activeTab: ActiveTab = 'reel';
  simulationResult: SimulationResult | null = null;

  currentValues: CurrentValues = this.createEmptyCurrentValues();

  simParams: SimulationParams = {
    tjm: undefined,
    jours_travailles: undefined,
    repas_restaurant: undefined,
    total_note_frais: undefined,
    total_note_kilometrique: undefined
  };

  readonly classOrder = ['BON_MOIS', 'MOYEN_MOIS', 'MAUVAIS_MOIS'];

  constructor(
    private projetService: ProjetService,
    private financeService: FinanceDataService,
    private simulationService: SimulationService
  ) {}

  ngOnInit(): void {
    this.loadProjets();
  }

  loadProjets(): void {
    this.loadingProjets = true;
    this.projetService.getProjets().subscribe({
      next: (data) => {
        this.projets = data || [];
        this.loadingProjets = false;
      },
      error: () => {
        this.loadingProjets = false;
        this.errorMessage = 'Impossible de charger les projets.';
      }
    });
  }

  onProjetChange(): void {
    this.simulationResult = null;
    this.errorMessage = '';
    this.activeTab = 'reel';
    this.resetSimulationForm();

    if (!this.selectedProjetId) {
      this.currentValues = this.createEmptyCurrentValues();
      return;
    }

    this.loadLastHistorique();
  }

  loadLastHistorique(): void {
    this.loadingLastData = true;
    this.financeService.getHistoriques().subscribe({
      next: (historiques) => {
        const filtered = (historiques || [])
          .filter((h) => h.projet_id === this.selectedProjetId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (!filtered.length) {
          this.currentValues = this.createEmptyCurrentValues();
          this.loadingLastData = false;
          return;
        }

        const last = filtered[0];
        const salaireNetHorsRepas = this.toNumber(
          last.salaireNetHorsRepas,
          this.toNumber(last.netAvantImpot) - this.toNumber(last.repasRestaurant)
        );

        this.currentValues = {
          tjm: this.toNumber(last.tjm),
          joursTravailles: this.toNumber(last.joursTravailles),
          repasRestaurant: this.toNumber(last.repasRestaurant),
          totalNoteFrais: this.toNumber(last.totalNoteFrais),
          totalNoteKilometrique: this.toNumber(last.totalNoteKilometrique),
          paye: last.paye ?? null,
          facture: this.toNumber(last.totaleFacture, this.toNumber(last.facture)),
          cout: this.toNumber(
            last.totalePercu,
            salaireNetHorsRepas +
              this.toNumber(last.repasRestaurant) +
              this.toNumber(last.totalNoteFrais) +
              this.toNumber(last.totalNoteKilometrique)
          ),
          rentabilite: this.toNumber(last.rentabilite),
          salaireNetHorsRepas
        };

        this.prefillSimulationForm();
        this.loadingLastData = false;
      },
      error: () => {
        this.currentValues = this.createEmptyCurrentValues();
        this.loadingLastData = false;
        this.errorMessage = 'Impossible de charger le dernier mois réel.';
      }
    });
  }

  runSimulation(): void {
    if (!this.selectedProjetId) return;

    this.simulationRunning = true;
    this.errorMessage = '';

    const payload: SimulationParams = {};
    Object.entries(this.simParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        (payload as any)[key] = Number(value);
      }
    });

    this.simulationService.simulerProjet(this.selectedProjetId, payload).subscribe({
      next: (res: SimulationResult) => {
        this.simulationResult = res;
        this.simulationRunning = false;
        this.activeTab = 'simulation';
      },
      error: () => {
        this.simulationRunning = false;
        this.errorMessage = 'La simulation a échoué. Vérifiez le backend FastAPI et les données du projet.';
      }
    });
  }

  resetSimulationForm(): void {
    this.simParams = {
      tjm: undefined,
      jours_travailles: undefined,
      repas_restaurant: undefined,
      total_note_frais: undefined,
      total_note_kilometrique: undefined
    };
  }

  prefillSimulationForm(): void {
    this.simParams = {
      tjm: this.currentValues.tjm,
      jours_travailles: this.currentValues.joursTravailles,
      repas_restaurant: this.currentValues.repasRestaurant,
      total_note_frais: this.currentValues.totalNoteFrais,
      total_note_kilometrique: this.currentValues.totalNoteKilometrique
    };
  }

  get realData(): LastReel | null {
    return this.simulationResult?.last_reel || null;
  }

  get simulatedTjm(): number {
    return this.toNumber(this.simParams.tjm, this.realData?.tjm ?? this.currentValues.tjm);
  }

  get simulatedJours(): number {
    return this.toNumber(this.simParams.jours_travailles, this.realData?.jours ?? this.currentValues.joursTravailles);
  }

  get selectedProjectName(): string {
    return this.projets.find((p) => p.id === this.selectedProjetId)?.nom || 'Projet';
  }

  get deltaRentabilite(): number {
    const reel = this.realData?.rentabilite ?? this.currentValues.rentabilite;
    return this.toNumber(this.simulationResult?.simulation?.rentabilite) - reel;
  }

  get deltaFacture(): number {
    const reel = this.realData?.facture ?? this.currentValues.facture;
    return this.toNumber(this.simulationResult?.simulation?.facture_sim) - reel;
  }

  get conseils(): ConseilIA[] {
    return this.simulationResult?.conseils_ia?.conseils || [];
  }

  get hasConseils(): boolean {
    const ia = this.simulationResult?.conseils_ia;
    return !!(ia?.resume || this.conseils.length || ia?.conseil_tjm || ia?.conseil_jours || ia?.seuil_rentabilite);
  }

  get primaryDecision(): ClassificationCas | null {
    return this.simulationResult?.profil_dt?.cas_paye || null;
  }


  get verdictClass(): string {
    const verdict = this.normalizeVerdict(this.simulationResult?.conseils_ia?.verdict);
    if (verdict === 'positif') return 'state-good';
    if (verdict === 'negatif') return 'state-bad';
    return 'state-neutral';
  }

  get verdictLabel(): string {
    const verdict = this.normalizeVerdict(this.simulationResult?.conseils_ia?.verdict);
    if (verdict === 'positif') return 'Positif';
    if (verdict === 'negatif') return 'Négatif';
    return 'Neutre';
  }

  classificationLabel(classe?: ClasseMois | null): string {
    if (classe === 'BON_MOIS') return 'BON';
    if (classe === 'MOYEN_MOIS') return 'MOYEN';
    if (classe === 'MAUVAIS_MOIS') return 'MAUVAIS';
    return 'INCONNU';
  }

  classificationClass(classe?: ClasseMois | null): string {
    if (classe === 'BON_MOIS') return 'state-good';
    if (classe === 'MAUVAIS_MOIS') return 'state-bad';
    if (classe === 'MOYEN_MOIS') return 'state-warning';
    return 'state-neutral';
  }

  priorityClass(priority?: string): string {
    if (priority === 'haute') return 'priority-high';
    if (priority === 'moyenne') return 'priority-medium';
    return 'priority-low';
  }

  conseilTypeClass(type?: string): string {
    if (type === 'alerte') return 'advice-alert';
    if (type === 'optimisation') return 'advice-opt';
    return 'advice-action';
  }



  paymentLabel(value: number | boolean | string | null | undefined): string {
    if (value === true || value === 1 || value === '1') return 'Payé';
    if (value === false || value === 0 || value === '0') return 'Non payé';
    if (typeof value === 'string' && value.trim()) return value;
    return 'Non renseigné';
  }

  money(value: number | null | undefined): number {
    return this.toNumber(value);
  }

  private createEmptyCurrentValues(): CurrentValues {
    return {
      tjm: 0,
      joursTravailles: 0,
      repasRestaurant: 0,
      totalNoteFrais: 0,
      totalNoteKilometrique: 0,
      paye: null,
      facture: 0,
      cout: 0,
      rentabilite: 0,
      salaireNetHorsRepas: 0
    };
  }

  private normalizeVerdict(verdict?: string): 'positif' | 'negatif' | 'neutre' {
    if (verdict === 'positif') return 'positif';
    if (verdict === 'négatif' || verdict === 'negatif') return 'negatif';
    return 'neutre';
  }

  private toNumber(value: any, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
}
