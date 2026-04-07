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

  getTopClients(): Observable<any> {
    return this.http.get('http://localhost:8000/clients/top_ca');
  }
 getRentabiliteParSalarie() {
  return this.http.get<any[]>('http://localhost:8000/historiques')
    .pipe(
      map(data => {
        // Agréger la rentabilité par salarié
        const totals: { [id: number]: { nom: string, rentabilite: number } } = {};

        data.forEach(item => {
          const id = item.salarie_id;
          const nom = item.salarie?.username || `Salarie ${id}`;
          if (!totals[id]) {
            totals[id] = { nom, rentabilite: 0 };
          }
          totals[id].rentabilite += item.rentabilite || 0;
        });

        // Transformer en tableau et trier par rentabilité décroissante
        return Object.values(totals)
          .sort((a, b) => b.rentabilite - a.rentabilite)
          .slice(0, 3); // Top 3 salariés
      })
    );
}
getTop3ProjetsRentables() {
  return this.http.get<any[]>('http://localhost:8000/historiques')
    .pipe(
      map(data => {
        // Agréger la rentabilité par projet
        const totals: { [id: number]: { nom: string, rentabilite_totale: number } } = {};

        data.forEach(item => {
          const id = item.projet_id;
          const nom = item.projet_sal.nom
          if (!totals[id]) {
            totals[id] = { nom, rentabilite_totale: 0 };
          }
          totals[id].rentabilite_totale += item.rentabilite || 0;
        });

        // Transformer en tableau et trier par rentabilité décroissante
        return Object.values(totals)
          .sort((a, b) => b.rentabilite_totale - a.rentabilite_totale)
          .slice(0, 3); // Top 3 projets
      })
    );
}
}
