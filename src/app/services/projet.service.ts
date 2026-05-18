import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Salarie } from './salarie-service.service';
export interface Projet {
  id:number;
  nom: string;
  client?:any;
  client_id?: number | null;   
  tjm?: number | null;
  status_paiement?: string | null;
  marge_cible?: number | null;
  champ_remarque?: string | null;
  salarie_id?: number | null;
  salarie:Salarie|null;
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
      deleteProjet(id:Number):Observable<Projet> {
        return this.http.delete<Projet>(`http://localhost:8000/projet/${id}`);
      }
       getProjetsById(id: number): Observable<Projet[]> {
        return this.http.get<Projet[]>(`http://localhost:8000/projets/${id}`);
      }
}
