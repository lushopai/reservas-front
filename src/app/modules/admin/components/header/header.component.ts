import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { User } from 'src/app/shared/models/User';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  @Input() currentUser: User | null = null;
  @Output() toggleSidebar = new EventEmitter<void>();

  showNotifications = false;
  showUserMenu = false;
  isMenuOpen = false;
  isUserMenuOpen = false;

  notifications = [
    { id: 1, message: 'Nueva reserva pendiente', time: 'Hace 5 min', unread: true },
    { id: 2, message: 'Usuario promovido a VIP', time: 'Hace 15 min', unread: true },
    { id: 3, message: 'Pago confirmado', time: 'Hace 1 hora', unread: false }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Suscribirse a cambios del usuario si no viene por @Input
    if (!this.currentUser) {
      this.authService.currentUser$.subscribe(
        (user) => (this.currentUser = user)
      );
    }
  }

  /**
   * Obtener nombre para mostrar
   */
  get displayName(): string {
    if (!this.currentUser) return 'Administrador';

    if (this.currentUser.nombreCompleto) {
      return this.currentUser.nombreCompleto;
    }

    if (this.currentUser.nombres && this.currentUser.apellidos) {
      return `${this.currentUser.nombres} ${this.currentUser.apellidos}`;
    }

    return this.currentUser.username;
  }

  get unreadNotifications(): number {
    return this.notifications.filter(n => n.unread).length;
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showUserMenu = false;
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    this.isUserMenuOpen = !this.isUserMenuOpen;
    this.showNotifications = false;
  }

  closeMenus(): void {
    this.showNotifications = false;
    this.showUserMenu = false;
    this.isMenuOpen = false;
    this.isUserMenuOpen = false;
  }

  goToProfile(): void {
    if (this.currentUser) {
      this.router.navigate(['/admin/usuarios', this.currentUser.id]);
      this.closeMenus();
    }
  }

  goToSettings(): void {
    this.router.navigate(['/admin/configuracion']);
    this.closeMenus();
  }

  logout(): void {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro de que quieres salir del panel de administración?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#667eea',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
      }
    });
  }
}
