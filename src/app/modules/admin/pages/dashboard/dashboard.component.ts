import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { UserService } from 'src/app/core/services/UserService.service';
import { User } from 'src/app/shared/models/User';

interface DashboardStats {
  totalUsuarios: number;
  usuariosActivos: number;
  usuariosNuevos: number;
  totalReservas: number;
  reservasPendientes: number;
  reservasConfirmadas: number;
  reservasCanceladas: number;
  totalCabanas: number;
  cabanasDisponibles: number;
  ingresosMes: number;
  ingresosHoy: number;
}

interface ReservaReciente {
  id: number;
  usuario: string;
  recurso: string;
  fecha: Date;
  estado: string;
  monto: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  loading = true;

  stats: DashboardStats = {
    totalUsuarios: 0,
    usuariosActivos: 0,
    usuariosNuevos: 0,
    totalReservas: 0,
    reservasPendientes: 0,
    reservasConfirmadas: 0,
    reservasCanceladas: 0,
    totalCabanas: 12,
    cabanasDisponibles: 8,
    ingresosMes: 0,
    ingresosHoy: 0,
  };

  reservasRecientes: ReservaReciente[] = [];
  usuariosRecientes: User[] = [];

  // Datos para gráficos (ejemplo)
  reservasChart = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    data: [12, 19, 8, 15, 22, 18, 25],
  };

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;

    // Cargar usuarios
    this.userService.getAllUsers().subscribe({
      next: (usuarios) => {
        this.stats.totalUsuarios = usuarios.length;
        this.stats.usuariosActivos = usuarios.filter((u) => u.enabled).length;

        // Usuarios nuevos del último mes
        const unMesAtras = new Date();
        unMesAtras.setMonth(unMesAtras.getMonth() - 1);
        this.stats.usuariosNuevos = usuarios.filter(
          (u) => u.fechaRegistro && new Date(u.fechaRegistro) >= unMesAtras
        ).length;

        // Últimos 5 usuarios registrados
        this.usuariosRecientes = usuarios
          .sort((a, b) => {
            const dateA = a.fechaRegistro
              ? new Date(a.fechaRegistro).getTime()
              : 0;
            const dateB = b.fechaRegistro
              ? new Date(b.fechaRegistro).getTime()
              : 0;
            return dateB - dateA;
          })
          .slice(0, 5);

        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar datos:', error);
        this.loading = false;
      },
    });

    // TODO: Cargar reservas (cuando tengas el servicio)
    // this.reservaService.getAll().subscribe(...)

    // Datos de ejemplo para reservas
    this.loadReservasEjemplo();
  }

  loadReservasEjemplo(): void {
    // Datos de ejemplo (reemplazar con datos reales)
    this.stats.totalReservas = 128;
    this.stats.reservasPendientes = 15;
    this.stats.reservasConfirmadas = 98;
    this.stats.reservasCanceladas = 15;
    this.stats.ingresosMes = 45000;
    this.stats.ingresosHoy = 1200;

    this.reservasRecientes = [
      {
        id: 1,
        usuario: 'Juan Pérez',
        recurso: 'Cabaña Deluxe',
        fecha: new Date(),
        estado: 'CONFIRMADA',
        monto: 150000,
      },
      {
        id: 2,
        usuario: 'María López',
        recurso: 'Servicio Spa',
        fecha: new Date(),
        estado: 'PENDIENTE',
        monto: 45000,
      },
      {
        id: 3,
        usuario: 'Pedro Soto',
        recurso: 'Cabaña Familiar',
        fecha: new Date(),
        estado: 'CONFIRMADA',
        monto: 120000,
      },
    ];
  }



  get porcentajeOcupacion(): number {
    if (this.stats.totalCabanas === 0) return 0;
    const ocupadas = this.stats.totalCabanas - this.stats.cabanasDisponibles;
    return Math.round((ocupadas / this.stats.totalCabanas) * 100);
  }

  getEstadoBadgeClass(estado: string): string {
    const classes: any = {
      CONFIRMADA: 'bg-success',
      PENDIENTE: 'bg-warning text-dark',
      CANCELADA: 'bg-danger',
      COMPLETADA: 'bg-info',
    };
    return classes[estado] || 'bg-secondary';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  }

  // Navegación
  verUsuarios(): void {
    this.router.navigate(['/admin/usuarios']);
  }

  verReservas(): void {
    this.router.navigate(['/admin/reservas']);
  }

  verReserva(id: number): void {
    this.router.navigate(['/admin/reservas', id]);
  }

  verUsuario(id: number): void {
    this.router.navigate(['/admin/usuarios', id]);
  }
}
