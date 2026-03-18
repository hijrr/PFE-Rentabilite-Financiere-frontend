import { Component, OnInit } from '@angular/core';
import { forkJoin, tap } from 'rxjs';
import { ExtractionService } from 'src/app/services/extraction.service';
import { FinanceDataService } from 'src/app/services/finance-data.service';

@Component({
  selector: 'app-finance-import-component',
  templateUrl: './finance-import-component.component.html',
  styleUrls: ['./finance-import-component.component.css']
})
export class FinanceImportComponentComponent implements OnInit {
   constructor(private extractionService: ExtractionService,private financeDataService: FinanceDataService) { }

 fichePaieFile: File | null = null;
  noteFraisFile: File | null = null;
  noteFraisKilometriqueFile: File | null = null;

  fichePaieError = '';
  noteFraisError = '';
  noteFraisKilometriqueError = '';

extractedData: any = { fichePaie: null, noteFrais: null, noteFraisKilometrique: null };

  validExtensions = ['pdf','xlsx','xls'];
  isProcessing = false;

  onFichePaieSelected(event: any) {
    const file = event.target.files[0];

    if (file && this.validateFile(file)) {
      this.fichePaieFile = file;
    } else {
      this.fichePaieError = 'Fichier doit etre au format PDF ou Excel';
      this.fichePaieFile = null;
    }
  }

  onNoteFraisSelected(event: any) {
    const file = event.target.files[0];//tab de fichiers dima

    if (file && this.validateFile(file)) {
      this.noteFraisFile = file;
    } else {
      this.noteFraisError = 'Fichier doit etre au format PDF ou Excel';
      this.noteFraisFile = null;
    }
  }
  onNoteFraisKiloSelected(event: any) {
    const file = event.target.files[0];//tab de fichiers dima

    if (file && this.validateFile(file)) {
      this.noteFraisKilometriqueFile = file;
    } else {
      this.noteFraisKilometriqueError = 'Fichier doit etre au format PDF ou Excel';
      this.noteFraisKilometriqueFile = null;
    }
  }

  validateFile(file: File): boolean {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return (!!extension &&//bech trajaaa true wala false
this.validExtensions.includes(extension)
    );
  }

  onSubmit() {
  if (this.isProcessing) return; // éviter double clic
  this.isProcessing = true;

  const observables = [];

  if (this.fichePaieFile) {
    observables.push(
      this.extractionService.extractFicheDePaie(this.fichePaieFile)
        .pipe(tap(res => {
          this.extractedData.fichePaie = res;
          console.log('Données Fiche de Paie:', res);
        }))
    );
  }

  if (this.noteFraisFile) {
    observables.push(
      this.extractionService.extractNoteDeFrais(this.noteFraisFile)
        .pipe(tap(res => {
          this.extractedData.noteFrais = res;
          console.log('Données Note de Frais:', res);
        }))
    );
  }

  if (this.noteFraisKilometriqueFile) {
    observables.push(
      this.extractionService.extractNoteDeFraisKilometrique(this.noteFraisKilometriqueFile)
        .pipe(tap(res => {
          this.extractedData.noteFraisKilometrique = res;
          console.log('Données Note de Frais Kilométrique:', res);
        }))
    );
  }

  // Exécuter toutes les requêtes en parallèle
  forkJoin(observables).subscribe({
    next: () => {
      this.sendIfReady();    // fusion des données
      this.isProcessing = false; // réactive le bouton
      // Si tu veux, recharge la page :
      // window.location.reload();
    },
    error: (err) => {
      console.error('Erreur lors du traitement :', err);
      this.isProcessing = false; // réactive le bouton en cas d'erreur
    }
  });
}
 sendIfReady() {
    // On ne continue que si tous les fichiers importés ont été traités
    if ((this.fichePaieFile && !this.extractedData.fichePaie) ||
        (this.noteFraisFile && !this.extractedData.noteFrais) ||
        (this.noteFraisKilometriqueFile && !this.extractedData.noteFraisKilometrique)) {
      return;
    }

    // Fusionner toutes les données extraites
    const mergedData = {
       salaireBrut: this.extractedData.fichePaie?.salaire_brut ,
      totalCotisationsSalariales: this.extractedData.fichePaie?.total_cotisations_salariales ,
      chargesPatronales: this.extractedData.fichePaie?.charges_patronales ,
      repasRestaurant: this.extractedData.fichePaie?.repas_restaurant ,
      netAvantImpot: this.extractedData.fichePaie?.net_avant_impot ,
      netPayer: this.extractedData.fichePaie?.net_paye ,
      totalNoteFrais: this.extractedData.noteFrais?.total_a_verser ,
      totalNoteKilometrique: this.extractedData.noteFraisKilometrique?.total_en_euro
    };

    // Envoyer au service partagé
    this.financeDataService.setFinanceData(mergedData);
  }
  resetForm() {
    this.fichePaieFile = null;
    this.noteFraisFile = null;
    this.noteFraisKilometriqueFile = null;
    this.fichePaieError = '';
    this.noteFraisError = '';
    this.noteFraisKilometriqueError = '';
  }


  ngOnInit(): void {
  }

}


