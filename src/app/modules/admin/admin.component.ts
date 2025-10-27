import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  showSearchBar = false;
  isMobileMenuOpen = false;

  notifications = [
    { id: 1, message: 'Nueva reserva pendiente de aprobación', time: 'Hace 5 min', icon: 'event', read: false },
    { id: 2, message: 'Pago confirmado - Reserva #1234', time: 'Hace 1 hora', icon: 'payments', read: false },
    { id: 3, message: 'Nuevo usuario registrado', time: 'Hace 2 horas', icon: 'person_add', read: true }
  ];

  currentUser: any = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Obtener usuario actual
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleSearchBar(): void {
    this.showSearchBar = !this.showSearchBar;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  get unreadNotificationsCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  markNotificationAsRead(notification: any): void {
    notification.read = true;
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  viewAsCustomer(): void {
    this.router.navigate(['/']);
  }

  goToProfile(): void {
    // Admin navega a su detalle de usuario, no a perfil de cliente
    if (this.currentUser && this.currentUser.id) {
      this.router.navigate(['/admin/usuarios/detalle', this.currentUser.id]);
    }
  }
}
