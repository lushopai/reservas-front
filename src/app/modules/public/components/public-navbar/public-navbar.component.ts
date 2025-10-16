import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-public-navbar',
  templateUrl: './public-navbar.component.html',
  styleUrls: ['./public-navbar.component.scss']
})
export class PublicNavbarComponent {
  isMenuOpen = false;
  isLoggedIn = false;
  userRole: string | null = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    // Verificar si el usuario está logueado
    this.isLoggedIn = this.authService.isAuthenticated();
    if (this.isLoggedIn) {
      const user = this.authService.getCurrentUser();
      if (user && user.roles && user.roles.length > 0) {
        const role = user.roles[0];
        this.userRole = typeof role === 'string' ? role : role.name;
      }
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
    this.closeMenu();
  }

  goToRegister(): void {
    this.router.navigate(['/registro']);
    this.closeMenu();
  }

  goToDashboard(): void {
    if (this.userRole === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/cliente/mis-reservas']);
    }
    this.closeMenu();
  }

  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    this.userRole = null;
    this.router.navigate(['/']);
    this.closeMenu();
  }
}
