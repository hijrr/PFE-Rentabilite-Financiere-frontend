import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PredictionIAService {

  constructor(private http: HttpClient) { }
   getPrevisionMarge(projetId: number): Observable<any> {
    return this.http.get(`http://localhost:8000/prevision-marge/projet/${projetId}`);
  }
}
