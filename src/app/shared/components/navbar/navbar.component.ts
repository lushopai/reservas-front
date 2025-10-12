import { Component, OnInit } from '@angular/core';
import { User } from '../../models/User';
import { AuthService } from 'src/app/core/services/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;
  isMenuOpen = false;
  isUserMenuOpen = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Suscribirse a cambios del usuario
    this.authService.currentUser$.subscribe(
      (user) => (this.currentUser = user)
    );
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  /**
   * Verificar si es admin
   */
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }


  /**
   * Obtener nombre para mostrar
   */
  get displayName(): string {
    if (!this.currentUser) return 'Usuario';

    if (this.currentUser.nombreCompleto) {
      return this.currentUser.nombreCompleto;
    }

    if (this.currentUser.nombres && this.currentUser.apellidos) {
      return `${this.currentUser.nombres} ${this.currentUser.apellidos}`;
    }

    return this.currentUser.username;
  }

  /**
   * Alternar menú mobile
   */
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  /**
   * Alternar menú de usuario
   */
  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  /**
   * Cerrar menús al hacer clic fuera
   */
  closeMenus(): void {
    this.isMenuOpen = false;
    this.isUserMenuOpen = false;
  }

  /**
   * Ir a perfil
   */
  goToProfile(): void {
    if (this.currentUser) {
      this.router.navigate(['/perfil', this.currentUser.id]);
      this.closeMenus();
    }
  }

  /**
   * Ir al panel de admin
   */
  goToAdmin(): void {
    this.router.navigate(['/admin/dashboard']);
    this.closeMenus();
  }

  /**
   * Logout
   */
  logout(): void {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro de que quieres salir?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#667eea',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
        this.closeMenus();

        Swal.fire({
          icon: 'success',
          title: 'Sesión cerrada',
          text: 'Has cerrado sesión exitosamente',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  }
}
