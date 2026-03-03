import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  constructor(private http: HttpClient) { }
   getClients(): Observable<any> {
    return this.http.get<any>('http://localhost:8000/clients');
  }
  getClientLogo(modulepart: string, filePath: string): Observable<any> {
    return this.http.get<any>(`http://localhost:8000/client-logo/${modulepart}/${filePath}`);
  }
}
