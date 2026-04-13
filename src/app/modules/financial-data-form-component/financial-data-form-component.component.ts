import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FinanceDataService } from 'src/app/services/finance-data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-financial-data-form-component',
  templateUrl: './financial-data-form-component.component.html',
  styleUrls: ['./financial-data-form-component.component.css']
})
export class FinancialDataFormComponentComponent implements OnInit {
dolibarData: any;

   financeForm :FormGroup=new FormGroup({
      salaireBrut : new FormControl('',[Validators.required]),
      totalCotisationsSalariales : new FormControl('',[Validators.required,]),
      chargesPatronales : new FormControl('',[Validators.required,]),
      repasRestaurant : new FormControl('',[Validators.required,]),
      netAvantImpot : new FormControl('',[Validators.required,]),
      netPayer: new FormControl('',[Validators.required,]),
       totalNoteFrais : new FormControl('',[Validators.required,]),
      totalNoteKilometrique: new FormControl('',[Validators.required,]),
      tjm: new FormControl('',[Validators.required,]),
      joursTravailles: new FormControl('',[Validators.required,]),
      facture: new FormControl('',[Validators.required,]),
       paye: new FormControl(false),
    });
    kpiForm = new FormGroup({
  salaireNetHorsRepas: new FormControl({value: 0, disabled: true}),
  totalePercu: new FormControl({value: 0, disabled: true}),
  totaleFacture: new FormControl({value: 0, disabled: true}),
  rentabilite: new FormControl({value: 0, disabled: true}),
});
  constructor(private financeDataService: FinanceDataService) { }
togglePaye() {
  const current = this.financeForm.get('paye')?.value;
  this.financeForm.get('paye')?.setValue(!current);
  this.updateKPI();
}
updateFacture() {
  const tjm = Number(this.financeForm.get('tjm')?.value) || 0;
  const jours = Number(this.financeForm.get('joursTravailles')?.value) || 0;

  const facture = tjm * jours;

  this.financeForm.patchValue(
    { facture: facture },
    { emitEvent: false } // ⚠️ très important
  );
}
  ngOnInit(): void {

     // S'abonner au service pour recevoir les données
   this.financeDataService.financeData$.subscribe(data => {
  if (data) {

    this.financeForm.patchValue({
      salaireBrut: data.salaireBrut,
      totalCotisationsSalariales: data.totalCotisationsSalariales,
      chargesPatronales: Number(data.chargesPatronales),
      repasRestaurant: Number(data.repasRestaurant),
      netAvantImpot: data.netAvantImpot,
      netPayer: data.netPayer,
      totalNoteFrais: data.totalNoteFrais,
      totalNoteKilometrique: Number(data.totalNoteKilometrique),

    });
  }
});
this.financeDataService.dolibarData$.subscribe(data => {
  if (data) {
    this.dolibarData=data;
    this.financeForm.patchValue({
      tjm: Number(data.tjm),
      joursTravailles: Number(data.jours_travailles),
      paye: data.paye,
    });
    this.updateFacture();
    console.log('Données Dolibarr reçues dans le formulaire :', data);
  }
});
 this.financeForm.valueChanges.subscribe(() => {this.updateKPI(); });
 this.financeForm.get('tjm')?.valueChanges.subscribe(() => this.updateFacture());
this.financeForm.get('joursTravailles')?.valueChanges.subscribe(() => this.updateFacture());

}

updateKPI() {
  const netHorsRepas = this.financeForm.get('netAvantImpot')?.value - (this.financeForm.get('repasRestaurant')?.value || 0);
  const totalPercu = netHorsRepas +
                     (this.financeForm.get('repasRestaurant')?.value || 0) +
                     (this.financeForm.get('totalNoteFrais')?.value || 0) +
                   Number((this.financeForm.get('totalNoteKilometrique')?.value || 0));
  const factureTotale = (this.financeForm.get('paye')?.value ? 1 : 0) *
                        (this.financeForm.get('facture')?.value || 0);
  const rentabilite = factureTotale - totalPercu;
  console.log('Calcul des KPI :', { netHorsRepas, totalPercu, factureTotale, rentabilite });

  this.kpiForm.patchValue({
    salaireNetHorsRepas: netHorsRepas,
    totalePercu: totalPercu,
    totaleFacture: factureTotale,
    rentabilite: rentabilite
  });
}
resetForm(){
  this.financeForm.reset();
  this.kpiForm.reset({
    salaireNetHorsRepas: 0,
    totalePercu: 0,
    totaleFacture: 0,
    rentabilite: 0
  });
}

onSubmit() {
  if (this.financeForm.valid) {
    const financeData = this.financeForm.getRawValue();
    const kpiData = this.kpiForm.getRawValue();
   // Fusionner les deux objets pour envoyer au service
    const dataToSend = {
      date: this.dolibarData.date || null,
        salarie_id: this.dolibarData.salarie_id || null,
        projet_id: this.dolibarData.projet_id || null,
      ...financeData,
      ...kpiData
    };
    console.log('Données à envoyer :', dataToSend);
     this.financeDataService.createHistorique(dataToSend).subscribe({
      next: (res) => {
        Swal.fire({
  icon: 'success',
  title: 'Succès',
  text: 'Les données ont été enregistrées avec succès !',
  confirmButtonColor: '#28a745',
  timer: 2500,
  showConfirmButton: false
});
        console.log('Historique créé avec succès :', res);
      },
      error: (err) => {
        console.error('Erreur lors de la création de l\'historique :', err);
      }
    });

  } else {
    console.log('Formulaire invalide');
  }
}
}
