import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  constructor(private http: HttpClient) { }
   getClients(): Observable<any> {
    return this.http.get<any>('http://localhost:8000/clients?limit=10000');
  }
  getClientLogo(modulepart: string, filePath: string): Observable<any> {
    return this.http.get<any>(`http://localhost:8000/client-logo/${modulepart}/${filePath}`);
  }
   getInvoices(): Observable<any> {
    return this.http.get<any>('http://localhost:8000/invoices?limit=10000');
  }
  getclientsBD(): Observable<any> {
    return this.http.get<any>('http://localhost:8000/GETClients');  }
  getInvoicesBD(): Observable<any> {
    return this.http.get<any>('http://localhost:8000/GETFactures');  }
  getRoles(): Observable<any[]> {
        return this.http.get<any[]>('http://localhost:8000/roles');
      }
       addRole(data: any): Observable<any> {
      return this.http.post<any>(`http://localhost:8000/role`, data);
    }
     updateRole(id: number, data: any): Observable<any> {
      return this.http.put<any>(`http://localhost:8000/role/${id}`, data);
    }
     deleteRole(id: number): Observable<any> {
      return this.http.delete(`http://localhost:8000/role/${id}`);
    }
  syncAll(): Observable<any> {
  return this.http.get('http://localhost:8000/syncAll');
}
}
