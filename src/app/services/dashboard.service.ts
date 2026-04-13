import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private http: HttpClient) { }

  getTjmSalaries(): Observable<any> {
    return this.http.get('http://localhost:8000/salaries/tjm');
  }
getmargemoyen(): Observable<any> {
    return this.http.get('http://localhost:8000/kpi/marge_moyenne');
  }
  getTopClients(): Observable<any> {
    return this.http.get('http://localhost:8000/clients/top_ca');
  }

  getHistoriques(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:8000/historiques');
  }

 getRentabiliteParSalarie() {
  return this.http.get<any>('http://localhost:8000/kpi/rentabilite_salaries');
}

getTopProjets() {
  return this.http.get<any>('http://localhost:8000/kpi/top_projets');
}

getGlobalKPI() {
  return this.http.get<any>('http://localhost:8000/kpi/global');
}
 getEvolutionCA(annee?: number): Observable<any> {
  let url = 'http://localhost:8000/kpi/evolution_ca';
  if (annee) url += `?annee=${annee}`;
  return this.http.get(url);
}
}
