import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject, Observable } from 'rxjs';
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
   private loggedIn = new BehaviorSubject<boolean>(!!localStorage.getItem('token'));
   isLoggedIn$ = this.loggedIn.asObservable();

   getCurrentUser(): Observable<UserOut> {
    return this.http.get<UserOut>(`http://localhost:8000/me`);
  }
  login(token: string) {
    localStorage.setItem('token', token); // stocke le token
    this.loggedIn.next(true);              // notifie tous les abonnés
  }
  logout() {
  localStorage.removeItem('token'); // supprime le token
  this.loggedIn.next(false);              // notifie tous les abonnés

   this.router.navigate(['/login']);
}
getRole(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;

  const decoded: any = jwtDecode(token);
  return decoded?.role;
}

isAdmin(): boolean {
  return this.getRole() === 'admin';
}
}
