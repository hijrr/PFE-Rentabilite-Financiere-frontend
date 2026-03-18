import { Component, OnInit } from '@angular/core';
import { Salarie, SalarieServiceService } from 'src/app/services/salarie-service.service';

@Component({
  selector: 'app-dolibarr-sync-component',
  templateUrl: './dolibarr-sync-component.component.html',
  styleUrls: ['./dolibarr-sync-component.component.css']
})
export class DolibarrSyncComponentComponent implements OnInit {

  constructor(private salarieService: SalarieServiceService) { }

  ngOnInit(): void {
    this.loadSalaries();
  }
   // Données sélectionnées
  selectedSalarie: string = '';
  selectedDate: string = '';
  salaries:Salarie[] = [];
  // État de la synchronisation
  isSyncing: boolean = false;
  syncSuccess: boolean = false;
  syncError: string = '';



   loadSalaries(): void {
    this.salarieService.getSalaries().subscribe({
      next: (data) => {
        this.salaries = data || [];
        console.log('Salariés chargés:', this.salaries);
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  // Méthode de synchronisation
  synchroniserDolibarr() {
    if (!this.selectedSalarie || !this.selectedDate) {
      this.syncError = 'Veuillez sélectionner un salarié et une date';
      return;
    }

    this.isSyncing = true;
    this.syncError = '';
    this.syncSuccess = false;

    // Simulation de l'appel API Dolibarr
    setTimeout(() => {
      const success = Math.random() > 0.1;

      if (success) {
        this.syncSuccess = true;
        this.syncError = '';
        console.log('Synchronisation réussie avec Dolibarr', {
          salarie: this.selectedSalarie,
          date: this.selectedDate
        });
      } else {
        this.syncError = 'Erreur de synchronisation avec Dolibarr. Veuillez réessayer.';
        this.syncSuccess = false;
      }

      this.isSyncing = false;

      if (success) {
        setTimeout(() => {
          this.syncSuccess = false;
        }, 3000);
      }
    }, 2000);
  }

  // Réinitialiser le formulaire
  resetForm() {
    this.selectedSalarie = '';
    this.selectedDate = '';
    this.syncSuccess = false;
    this.syncError = '';
  }

  // Formater la date pour l'affichage
  get todayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // Formater la date avec le jour en toutes lettres
  formatDateWithDay(date: string): string {
    if (!date) return '';

    const [year, month, day] = date.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const mois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    const jourSemaine = jours[dateObj.getDay()];
    const jour = day;
    const moisNom = mois[parseInt(month) - 1];
    const annee = year;

    return `${jourSemaine} ${jour} ${moisNom} ${annee}`;
  }

  // Récupérer le nom du salarié
  getSalarieName(salarieId: string): string {
    const salarie = this.salaries.find(s => String(s.id) === salarieId);
    return salarie ? salarie.username : '';
  }

}
