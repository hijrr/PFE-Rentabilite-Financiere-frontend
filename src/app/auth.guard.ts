import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {

    const token = localStorage.getItem('token');

    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    // decode token
    const decoded: any = jwtDecode(token);
    const userRole = decoded?.role;

    // role required by route
    const expectedRole = route.data['role'];

    // if route has role restriction
    if (expectedRole && userRole !== expectedRole) {
      this.router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  }
}
