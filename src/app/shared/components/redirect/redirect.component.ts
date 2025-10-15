import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Componente de redirección inteligente
 * Redirige a los usuarios según su estado de autenticación y rol
 */
@Component({
  selector: 'app-redirect',
  template: `
    <div class="d-flex justify-content-center align-items-center" style="height: 100vh;">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Redirigiendo...</span>
      </div>
    </div>
  `
})
export class RedirectComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.redirectUser();
  }

  private redirectUser(): void {
    // Si está autenticado, redirigir según rol
    if (this.authService.isAuthenticated()) {
      // Usar el método isAdmin() del servicio
      if (this.authService.isAdmin()) {
        console.log('Redirigiendo admin a /admin');
        this.router.navigate(['/admin']);
      } else {
        console.log('Redirigiendo cliente a /cliente');
        this.router.navigate(['/cliente']);
      }
    } else {
      // Si no está autenticado, ir a login
      console.log('Usuario no autenticado, redirigiendo a login');
      this.router.navigate(['/auth/login']);
    }
  }
}
