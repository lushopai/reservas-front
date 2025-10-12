import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { User } from 'src/app/shared/models/User';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() currentUser: User | null = null;
  @Output() toggleSidebar = new EventEmitter<void>();

  showNotifications = false;
  showUserMenu = false;

  notifications = [
    { id: 1, message: 'Nueva reserva pendiente', time: 'Hace 5 min', unread: true },
    { id: 2, message: 'Usuario promovido a VIP', time: 'Hace 15 min', unread: true },
    { id: 3, message: 'Pago confirmado', time: 'Hace 1 hora', unread: false }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

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

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    this.showNotifications = false;
  }

  closeMenus(): void {
    this.showNotifications = false;
    this.showUserMenu = false;
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
