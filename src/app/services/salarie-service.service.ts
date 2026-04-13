import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
export interface Salarie {
  id:number;
  username: string;
  email: string;
  role_id: number;
  date_entree: Date;
  tjm?: number | null;
  adresse?: string | null;
  num_securite_sociale: number ;
}
@Injectable({
  providedIn: 'root'
})
export class SalarieServiceService {

  constructor(private http: HttpClient) { }
   getSalaries(): Observable<Salarie[]> {
      return this.http.get<Salarie[]>('http://localhost:8000/salaries');
    }
     addSalarie(data: any): Observable<Salarie> {
    return this.http.post<Salarie>(`http://localhost:8000/salaries`, data);
  }
   updateSalarie(id: number, data: any): Observable<Salarie> {
    return this.http.put<Salarie>(`http://localhost:8000/salarie/${id}`, data);
  }
   deleteSalarie(id: number): Observable<any> {
    return this.http.delete(`http://localhost:8000/salarie/${id}`);
  }
}
