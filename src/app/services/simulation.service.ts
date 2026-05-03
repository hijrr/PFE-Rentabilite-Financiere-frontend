import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface SimulationParams {
  tjm?: number;
  jours_travailles?: number;
  repas_restaurant?: number;
  total_note_frais?: number;
  total_note_kilometrique?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SimulationService {

  private apiUrl = 'http://127.0.0.1:8000/';

  constructor(private http: HttpClient) {}


   simulerProjet(projetId: number, params: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/simulation/projet/${projetId}`,
      params
    );
  }
}
