import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class NoAuthGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    if (!this.authService.isAuthenticated()) {
      console.log('Usuario no autenticado, permitiendo acceso a login/registro');
      return true;
    }

    console.log('Usuario ya autenticado, redirigiendo según rol');

    // Verificar rol usando el método isAdmin() del servicio
    if (this.authService.isAdmin()) {
      console.log('Redirigiendo admin a /admin');
      return this.router.createUrlTree(['/admin']);
    }

    // Si no es admin, redirigir a área de cliente
    console.log('Redirigiendo cliente a /cliente');
    return this.router.createUrlTree(['/cliente']);
  }
}