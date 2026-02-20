import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-financial-data-form-component',
  templateUrl: './financial-data-form-component.component.html',
  styleUrls: ['./financial-data-form-component.component.css']
})
export class FinancialDataFormComponentComponent implements OnInit {


   financeForm :FormGroup=new FormGroup({
      salaireBrut : new FormControl('',[Validators.required]),
      totalCotisationsSalariales : new FormControl('',[Validators.required,]),
      chargesPatronales : new FormControl('',[Validators.required,]),
      repasRestaurant : new FormControl('',[Validators.required,]),
      netAvantImpot : new FormControl('',[Validators.required,]),
      netPayer: new FormControl('',[Validators.required,]),
    });
  constructor() { }

  ngOnInit(): void {
  }
resetForm(){
  this.financeForm.reset();
}
}
