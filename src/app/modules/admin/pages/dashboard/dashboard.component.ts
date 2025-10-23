import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { AuthService } from 'src/app/core/services/auth.service';
import { UserService } from 'src/app/core/services/UserService.service';
import { DashboardService, DashboardStats, ReservaResume } from 'src/app/core/services/dashboard.service';
import { User } from 'src/app/shared/models/User';
import Swal from 'sweetalert2';

// ✅ Interface para agrupar reservas de paquete en dashboard
interface ReservaDisplay {
  id?: number;
  esPaquete: boolean;
  paqueteId?: number;
  nombrePaquete?: string;
  reservas: ReservaResume[];
  nombreUsuario: string;
  nombreRecurso: string;
  fechaReserva: string;
  estado: string;
  precioTotal: number;
  tipoReserva?: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  currentUser: User | null = null;
  loading = true;

  stats: DashboardStats | null = null;

  // MatTableDataSource para paginación
  reservasDataSource = new MatTableDataSource<ReservaDisplay>([]);
  reservasOriginales: ReservaResume[] = [];
  usuariosDataSource = new MatTableDataSource<User>([]);

  // Columnas de la tabla de reservas
  displayedColumns: string[] = ['id', 'usuario', 'recurso', 'estado', 'monto', 'acciones'];

  // ViewChild para paginadores
  @ViewChild('reservasPaginator') reservasPaginator!: MatPaginator;
  @ViewChild('usuariosPaginator') usuariosPaginator!: MatPaginator;

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
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}
  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Asignar paginadores después de que la vista se inicialice
    if (this.reservasPaginator) {
      this.reservasDataSource.paginator = this.reservasPaginator;
    }
    if (this.usuariosPaginator) {
      this.usuariosDataSource.paginator = this.usuariosPaginator;
    }
    this.cdr.detectChanges();
  }

  loadDashboardData(): void {
    this.loading = true;

    // Cargar estadísticas desde el backend
    this.dashboardService.obtenerEstadisticas().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats = response.data;

          // ✅ Guardar reservas originales y agrupar
          this.reservasOriginales = response.data.reservasRecientes || [];
          const reservasAgrupadas = this.agruparReservasPorPaquete(this.reservasOriginales);
          this.reservasDataSource.data = reservasAgrupadas;

          // Usar setTimeout para asegurar que el DOM se haya renderizado
          setTimeout(() => {
            if (this.reservasPaginator) {
              this.reservasDataSource.paginator = this.reservasPaginator;
            }
          }, 0);

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
        // Cargar todos los usuarios ordenados por fecha de registro (más recientes primero)
        const usuariosOrdenados = usuarios.sort((a, b) => {
          const dateA = a.fechaRegistro ? new Date(a.fechaRegistro).getTime() : 0;
          const dateB = b.fechaRegistro ? new Date(b.fechaRegistro).getTime() : 0;
          return dateB - dateA;
        });

        // Cargar en el dataSource para usar paginación
        this.usuariosDataSource.data = usuariosOrdenados;

        // Usar setTimeout para asegurar que el DOM se haya renderizado
        setTimeout(() => {
          if (this.usuariosPaginator) {
            this.usuariosDataSource.paginator = this.usuariosPaginator;
          }
        }, 0);
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

  // ✅ Método para agrupar reservas por paquete
  private agruparReservasPorPaquete(reservas: ReservaResume[]): ReservaDisplay[] {
    const paquetes = new Map<number, ReservaResume[]>();
    const individuales: ReservaResume[] = [];

    // Separar reservas en paquetes e individuales
    reservas.forEach(reserva => {
      if (reserva.paqueteId) {
        if (!paquetes.has(reserva.paqueteId)) {
          paquetes.set(reserva.paqueteId, []);
        }
        paquetes.get(reserva.paqueteId)!.push(reserva);
      } else {
        individuales.push(reserva);
      }
    });

    const resultado: ReservaDisplay[] = [];

    // Crear wrappers para paquetes
    paquetes.forEach((reservasPaquete, paqueteId) => {
      const primera = reservasPaquete[0];
      const estadoFinal = primera.estadoPaquete || primera.estado;

      // ✅ Usar precio final del paquete (con descuento) si está disponible
      const precioTotal = primera.precioFinalPaquete !== undefined && primera.precioFinalPaquete !== null
        ? primera.precioFinalPaquete
        : reservasPaquete.reduce((sum, r) => sum + r.precioTotal, 0);

      resultado.push({
        id: paqueteId,
        esPaquete: true,
        paqueteId: paqueteId,
        nombrePaquete: primera.nombrePaquete,
        reservas: reservasPaquete,
        nombreUsuario: primera.nombreUsuario,
        nombreRecurso: `Paquete: ${primera.nombrePaquete || 'Sin nombre'}`,
        fechaReserva: primera.fechaReserva,
        estado: estadoFinal,
        precioTotal: precioTotal,
        tipoReserva: 'PAQUETE'
      });
    });

    // Crear wrappers para reservas individuales
    individuales.forEach(reserva => {
      resultado.push({
        id: reserva.id,
        esPaquete: false,
        reservas: [reserva],
        nombreUsuario: reserva.nombreUsuario,
        nombreRecurso: reserva.nombreRecurso,
        fechaReserva: reserva.fechaReserva,
        estado: reserva.estado,
        precioTotal: reserva.precioTotal,
        tipoReserva: reserva.tipoReserva
      });
    });

    return resultado;
  }

  // Navegación
  verUsuarios(): void {
    this.router.navigate(['/admin/usuarios']);
  }

  verReservas(): void {
    this.router.navigate(['/admin/reservas']);
  }

  verReserva(element: ReservaDisplay): void {
    // Si es un paquete, navegar a la primera reserva del paquete
    const reservaId = element.esPaquete ? element.reservas[0].id : element.id;
    this.router.navigate(['/admin/reservas', reservaId]);
  }

  verUsuario(id: number): void {
    this.router.navigate(['/admin/usuarios', id]);
  }
}
