import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    console.log('AdminGuard - Checking authorization...');
    const user = this.authService.getCurrentUser();
    console.log('AdminGuard - User:', user);

    const isAdmin = user?.roles?.some(
      (role: any) => role.name === 'ROLE_ADMIN' || role === 'ROLE_ADMIN'
    );
    console.log('AdminGuard - isAdmin:', isAdmin);

    if (!isAdmin) {
      console.log('AdminGuard - Access denied, redirecting to login');
      Swal.fire({
        icon: 'error',
        title: 'Acceso Denegado',
        text: 'No tienes permisos para acceder a esta área',
        confirmButtonColor: '#3085d6',
      });
      return this.router.createUrlTree(['/auth/login']);
    }

    console.log('AdminGuard - Access granted');
    return true;
  }
}
