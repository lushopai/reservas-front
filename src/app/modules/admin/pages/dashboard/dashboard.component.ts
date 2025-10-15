import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { UserService } from 'src/app/core/services/UserService.service';
import { DashboardService, DashboardStats, ReservaResume } from 'src/app/core/services/dashboard.service';
import { User } from 'src/app/shared/models/User';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  loading = true;

  stats: DashboardStats | null = null;
  reservasRecientes: ReservaResume[] = [];
  usuariosRecientes: User[] = [];

  // Datos para gráficos
  reservasChart = {
    labels: [] as string[],
    data: [] as number[],
  };

  ingresosChart = {
    labels: [] as string[],
    data: [] as number[],
  };

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private dashboardService: DashboardService,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;

    // Cargar estadísticas desde el backend
    this.dashboardService.obtenerEstadisticas().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats = response.data;
          this.reservasRecientes = response.data.reservasRecientes || [];

          // Preparar datos para gráficos
          this.prepararGraficos();

          // Cargar usuarios recientes
          this.cargarUsuariosRecientes();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
        Swal.fire('Error', 'No se pudieron cargar las estadísticas del dashboard', 'error');
        this.loading = false;
      },
    });
  }

  prepararGraficos(): void {
    if (!this.stats) return;

    // Gráfico de reservas por día
    if (this.stats.reservasPorDia && this.stats.reservasPorDia.length > 0) {
      this.reservasChart.labels = this.stats.reservasPorDia.map(d => {
        const fecha = new Date(d.fecha);
        const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return dias[fecha.getDay()];
      });
      this.reservasChart.data = this.stats.reservasPorDia.map(d => d.cantidad);
    }

    // Gráfico de ingresos por mes
    if (this.stats.ingresosPorMes && this.stats.ingresosPorMes.length > 0) {
      this.ingresosChart.labels = this.stats.ingresosPorMes.map(m => {
        const [year, month] = m.mes.split('-');
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return meses[parseInt(month) - 1];
      });
      this.ingresosChart.data = this.stats.ingresosPorMes.map(m => m.monto);
    }
  }

  cargarUsuariosRecientes(): void {
    this.userService.getAllUsers().subscribe({
      next: (usuarios) => {
        // Últimos 5 usuarios registrados
        this.usuariosRecientes = usuarios
          .sort((a, b) => {
            const dateA = a.fechaRegistro ? new Date(a.fechaRegistro).getTime() : 0;
            const dateB = b.fechaRegistro ? new Date(b.fechaRegistro).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, 5);
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
      },
    });
  }



  get porcentajeOcupacion(): number {
    if (!this.stats || this.stats.totalCabanas === 0) return 0;
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
