import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
export interface UserOut {
  id: number;
  username: string;
  role: string;
  created_at: Date;
}
@Injectable({
  providedIn: 'root'
})

export class AuthService {

  constructor(private http: HttpClient,private router:Router) { }
   getCurrentUser(): Observable<UserOut> {
    return this.http.get<UserOut>(`http://localhost:8000/me`);
  }

  logout() {
  localStorage.removeItem('token'); // supprime le token

   this.router.navigate(['/login']);
}
}
