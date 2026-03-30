import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable,} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FinanceDataService {
   constructor(private http: HttpClient) { }
 // Observable qui contiendra les données extraites
  private financeDataSource = new BehaviorSubject<any>(null);
  financeData$ = this.financeDataSource.asObservable();
private DolibarData = new BehaviorSubject<any>(null);
  dolibarData$ = this.DolibarData.asObservable();
  // Fonction pour mettre à jour les données
  setFinanceData(data: any) {
    this.financeDataSource.next(data);
  }
  setDolibarData(data: any) {
    this.DolibarData.next(data);
  }


 createHistorique(data: any): Observable<any> {
    return this.http.post(`http://localhost:8000/historique`, data);
  }

  // Récupérer tous les historiques
  getHistoriques(): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8000/historiques`);
  }
}
