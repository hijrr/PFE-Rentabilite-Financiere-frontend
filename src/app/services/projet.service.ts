import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
export interface Projet {
  id:number;
  nom: string;
  client: string;
  jours_travailles?: number | null;
  tjm?: number | null;
  status_paiement?: string | null;


}
@Injectable({
  providedIn: 'root'
})
export class ProjetService {

  constructor(private http: HttpClient) { }
  getProjets(): Observable<Projet[]> {
        return this.http.get<Projet[]>('http://localhost:8000/projets');
      }
   addProjet(data: any): Observable<Projet> {
      return this.http.post<Projet>(`http://localhost:8000/projets`, data);
    }
     updateProjet(id: number, data: any): Observable<Projet> {
        return this.http.put<Projet>(`http://localhost:8000/projet/${id}`, data);
      }
}
