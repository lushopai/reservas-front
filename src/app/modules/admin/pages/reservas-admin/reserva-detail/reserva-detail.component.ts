import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservaService } from '../../../../../core/services/reserva.service';
import { Reserva, EstadoReserva } from '../../../../../core/models/reserva.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reserva-detail',
  templateUrl: './reserva-detail.component.html',
  styleUrls: ['./reserva-detail.component.scss']
})
export class ReservaDetailComponent implements OnInit {
  reserva!: Reserva;
  cargando = false;
  procesando = false;

  // Estados disponibles según estado actual
  estadosDisponibles: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservaService: ReservaService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.cargarReserva(+id);
    }
  }

  cargarReserva(id: number): void {
    this.cargando = true;
    this.reservaService.obtenerPorId(id).subscribe({
      next: (reserva) => {
        this.reserva = reserva;
        this.calcularEstadosDisponibles();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar reserva:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la información de la reserva',
          confirmButtonColor: '#dc3545'
        }).then(() => {
          this.volver();
        });
        this.cargando = false;
      }
    });
  }

  calcularEstadosDisponibles(): void {
    const estadoActual = this.reserva.estado;

    switch (estadoActual) {
      case 'BORRADOR':
        this.estadosDisponibles = ['PENDIENTE', 'CANCELADA'];
        break;
      case 'PENDIENTE':
        this.estadosDisponibles = ['CONFIRMADA', 'CANCELADA'];
        break;
      case 'CONFIRMADA':
        this.estadosDisponibles = ['EN_CURSO', 'CANCELADA'];
        break;
      case 'EN_CURSO':
        this.estadosDisponibles = ['COMPLETADA', 'CANCELADA'];
        break;
      case 'COMPLETADA':
      case 'CANCELADA':
        this.estadosDisponibles = []; // No se puede cambiar desde estos estados
        break;
      default:
        this.estadosDisponibles = [];
    }
  }

  cambiarEstado(nuevoEstado: string): void {
    Swal.fire({
      title: `¿Cambiar a ${nuevoEstado}?`,
      text: '¿Deseas agregar observaciones sobre este cambio?',
      input: 'textarea',
      inputPlaceholder: 'Observaciones (opcional)...',
      showCancelButton: true,
      confirmButtonText: 'Confirmar Cambio',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#667eea',
      preConfirm: (observaciones) => {
        return observaciones || '';
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.procesando = true;
        this.reservaService.cambiarEstadoReserva(
          this.reserva.id!,
          nuevoEstado,
          undefined,
          result.value
        ).subscribe({
          next: (response) => {
            this.procesando = false;
            Swal.fire({
              icon: 'success',
              title: '¡Estado actualizado!',
              text: `La reserva ahora está en estado ${nuevoEstado}`,
              confirmButtonColor: '#667eea'
            });
            // Recargar reserva
            this.cargarReserva(this.reserva.id!);
          },
          error: (error) => {
            this.procesando = false;
            console.error('Error al cambiar estado:', error);
            const mensaje = error.error?.message || 'No se pudo cambiar el estado de la reserva';
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: mensaje,
              confirmButtonColor: '#dc3545'
            });
          }
        });
      }
    });
  }

  cancelarReserva(): void {
    Swal.fire({
      title: '¿Cancelar Reserva?',
      text: 'Esta acción liberará los recursos reservados',
      input: 'textarea',
      inputLabel: 'Motivo de cancelación',
      inputPlaceholder: 'Ingresa el motivo...',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes ingresar un motivo';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
      confirmButtonColor: '#dc3545',
      icon: 'warning'
    }).then((result) => {
      if (result.isConfirmed) {
        this.procesando = true;
        this.cambiarEstado('CANCELADA');
      }
    });
  }

  volver(): void {
    this.router.navigate(['/admin/reservas']);
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(precio);
  }

  getBadgeClass(estado: string): string {
    switch (estado) {
      case EstadoReserva.PENDIENTE:
        return 'badge bg-warning';
      case EstadoReserva.CONFIRMADA:
        return 'badge bg-success';
      case EstadoReserva.EN_CURSO:
        return 'badge bg-info';
      case EstadoReserva.COMPLETADA:
        return 'badge bg-primary';
      case EstadoReserva.CANCELADA:
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  getEstadoIcon(estado: string): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'bi-clock-history';
      case 'CONFIRMADA':
        return 'bi-check-circle';
      case 'EN_CURSO':
        return 'bi-play-circle';
      case 'COMPLETADA':
        return 'bi-check-circle-fill';
      case 'CANCELADA':
        return 'bi-x-circle';
      default:
        return 'bi-circle';
    }
  }
}
