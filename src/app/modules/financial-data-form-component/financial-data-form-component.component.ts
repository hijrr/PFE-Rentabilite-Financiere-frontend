import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FinanceDataService } from 'src/app/services/finance-data.service';

@Component({
  selector: 'app-financial-data-form-component',
  templateUrl: './financial-data-form-component.component.html',
  styleUrls: ['./financial-data-form-component.component.css']
})
export class FinancialDataFormComponentComponent implements OnInit {

isPaid: boolean = false;
   financeForm :FormGroup=new FormGroup({
      salaireBrut : new FormControl('',[Validators.required]),
      totalCotisationsSalariales : new FormControl('',[Validators.required,]),
      chargesPatronales : new FormControl('',[Validators.required,]),
      repasRestaurant : new FormControl('',[Validators.required,]),
      netAvantImpot : new FormControl('',[Validators.required,]),
      netPayer: new FormControl('',[Validators.required,]),
       totalNoteFrais : new FormControl('',[Validators.required,]),
      totalNoteKilometrique: new FormControl('',[Validators.required,]),
    });
  constructor(private financeDataService: FinanceDataService) { }

  ngOnInit(): void {
     // S'abonner au service pour recevoir les données
   this.financeDataService.financeData$.subscribe(data => {
  if (data) {
    this.financeForm.patchValue({
      salaireBrut: data.salaireBrut,
      totalCotisationsSalariales: data.totalCotisationsSalariales,
      chargesPatronales: data.chargesPatronales,
      repasRestaurant: data.repasRestaurant,
      netAvantImpot: data.netAvantImpot,
      netPayer: data.netPayer,
      totalNoteFrais: data.totalNoteFrais,
      totalNoteKilometrique: data.totalNoteKilometrique
    });
  }
});
  }
resetForm(){
  this.financeForm.reset();
}
togglePayment() {
  this.isPaid = !this.isPaid;
  // Vous pouvez également émettre un événement ou appeler une API ici
}
}
