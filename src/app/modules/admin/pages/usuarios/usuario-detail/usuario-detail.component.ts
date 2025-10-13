import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserResponse } from 'src/app/shared/models/UserResponse';
import Swal from 'sweetalert2';
import { UserService } from '../../../../../core/services/UserService.service';

interface Reserva {
  id: number;
  recurso: string;
  fechaInicio: Date;
  fechaFin: Date;
  estado: string;
  monto: number;
}

@Component({
  selector: 'app-usuario-detail',
  templateUrl: './usuario-detail.component.html',
  styleUrls: ['./usuario-detail.component.scss']
})
export class UsuarioDetailComponent implements OnInit {
  usuario: UserResponse | null = null;
  loading = true;
  userId!: number;

  // Tabs
  activeTab: 'info' | 'reservas' | 'actividad' = 'info';

  // Reservas del usuario (simuladas por ahora)
  reservas: Reserva[] = [];

  // Actividad reciente
  actividades: any[] = [];

  // Estadísticas calculadas
  get reservasCompletadas(): number {
    return this.reservas.filter(r => r.estado === 'COMPLETADA').length;
  }

  get reservasActivas(): number {
    return this.reservas.filter(r => r.estado === 'CONFIRMADA').length;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.userId = +this.route.snapshot.params['id'];
    this.loadUsuario();
    this.loadReservas();
    this.loadActividad();
  }

  loadUsuario(): void {
    this.loading = true;

    this.userService.getProfile(this.userId).subscribe({
      next: (usuario) => {
        this.usuario = usuario;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar usuario:', error);
        this.loading = false;

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la información del usuario',
          confirmButtonColor: '#dc3545'
        }).then(() => {
          this.router.navigate(['/admin/usuarios']);
        });
      }
    });
  }

  loadReservas(): void {
    // TODO: Implementar cuando tengas el servicio de reservas
    // Por ahora datos de ejemplo
    this.reservas = [
      {
        id: 1,
        recurso: 'Cabaña Deluxe',
        fechaInicio: new Date('2025-01-15'),
        fechaFin: new Date('2025-01-20'),
        estado: 'CONFIRMADA',
        monto: 150000
      },
      {
        id: 2,
        recurso: 'Servicio Spa',
        fechaInicio: new Date('2025-01-10'),
        fechaFin: new Date('2025-01-10'),
        estado: 'COMPLETADA',
        monto: 45000
      }
    ];
  }

  loadActividad(): void {
    // Datos de ejemplo de actividad
    this.actividades = [
      { tipo: 'login', descripcion: 'Inició sesión', fecha: new Date() },
      { tipo: 'reserva', descripcion: 'Creó una nueva reserva', fecha: new Date() },
      { tipo: 'perfil', descripcion: 'Actualizó su perfil', fecha: new Date() }
    ];
  }

  setActiveTab(tab: 'info' | 'reservas' | 'actividad'): void {
    this.activeTab = tab;
  }

  editarUsuario(): void {
    this.router.navigate(['/admin/usuarios', this.userId, 'editar']);
  }



  cambiarEstado(): void {
    if (!this.usuario) return;

    const accion = this.usuario.enabled ? 'desactivar' : 'activar';

    Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario?`,
      text: `¿Estás seguro de ${accion} este usuario?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: this.usuario.enabled ? '#dc3545' : '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && this.usuario) {
        this.userService.toggleUserStatus(this.userId).subscribe({
          next: () => {
            this.loadUsuario();

            Swal.fire({
              icon: 'success',
              title: '¡Actualizado!',
              text: `Usuario ${accion === 'activar' ? 'activado' : 'desactivado'} correctamente`,
              confirmButtonColor: '#667eea'
            });
          },
          error: (error) => {
            console.error('Error al cambiar estado:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo cambiar el estado del usuario',
              confirmButtonColor: '#dc3545'
            });
          }
        });
      }
    });
  }

  eliminarUsuario(): void {
    Swal.fire({
      title: '¿Eliminar usuario?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.deleteUser(this.userId).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: '¡Eliminado!',
              text: 'Usuario eliminado correctamente',
              confirmButtonColor: '#667eea'
            }).then(() => {
              this.router.navigate(['/admin/usuarios']);
            });
          },
          error: (error) => {
            console.error('Error al eliminar usuario:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el usuario',
              confirmButtonColor: '#dc3545'
            });
          }
        });
      }
    });
  }

  volver(): void {
    this.router.navigate(['/admin/usuarios']);
  }

  getEstadoBadgeClass(estado: string): string {
    const classes: any = {
      'CONFIRMADA': 'bg-success',
      'PENDIENTE': 'bg-warning text-dark',
      'CANCELADA': 'bg-danger',
      'COMPLETADA': 'bg-info'
    };
    return classes[estado] || 'bg-secondary';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  }

  verReserva(id: number): void {
    this.router.navigate(['/admin/reservas', id]);
  }
}
