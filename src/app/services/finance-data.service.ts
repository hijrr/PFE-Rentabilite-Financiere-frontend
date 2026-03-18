import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FinanceDataService {
 // Observable qui contiendra les données extraites
  private financeDataSource = new BehaviorSubject<any>(null);
  financeData$ = this.financeDataSource.asObservable();

  // Fonction pour mettre à jour les données
  setFinanceData(data: any) {
    this.financeDataSource.next(data);
  }
  constructor() { }
}
