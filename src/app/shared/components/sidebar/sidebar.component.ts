import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../../models/User';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  badge?: string;
  badgeClass?: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  @Input() currentUser: User | null = null;

  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'fas fa-chart-line',
      route: '/admin/dashboard',
    },
    {
      label: 'Usuarios',
      icon: 'fas fa-users',
      route: '/admin/usuarios',
    },
    {
      label: 'Reservas',
      icon: 'fas fa-calendar-check',
      route: '/admin/reservas',
      badge: '5',
      badgeClass: 'bg-warning',
    },
    {
      label: 'Cabañas',
      icon: 'fas fa-home',
      route: '/admin/cabanas',
    },
    {
      label: 'Servicios',
      icon: 'fas fa-concierge-bell',
      route: '/admin/servicios',
    },
    {
      label: 'Paquetes',
      icon: 'fas fa-box-open',
      route: '/admin/paquetes',
    },
    {
      label: 'Reportes',
      icon: 'fas fa-file-alt',
      route: '/admin/reportes',
    },
    {
      label: 'Configuración',
      icon: 'fas fa-cog',
      route: '/admin/configuracion',
    },
  ];

  constructor(private router: Router) {}

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
