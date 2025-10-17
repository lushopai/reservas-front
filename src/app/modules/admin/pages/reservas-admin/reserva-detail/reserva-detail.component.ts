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
  estadosDisponibles: { value: string; label: string; color: string }[] = [];

  // Transiciones de estado permitidas
  transicionesEstado = {
    'BORRADOR': [
      { value: 'PENDIENTE', label: 'Pendiente', color: 'accent' },
      { value: 'CANCELADA', label: 'Cancelada', color: 'warn' }
    ],
    'PENDIENTE': [
      { value: 'CONFIRMADA', label: 'Confirmada', color: 'primary' },
      { value: 'CANCELADA', label: 'Cancelada', color: 'warn' }
    ],
    'CONFIRMADA': [
      { value: 'EN_CURSO', label: 'En Curso', color: 'accent' },
      { value: 'CANCELADA', label: 'Cancelada', color: 'warn' }
    ],
    'EN_CURSO': [
      { value: 'COMPLETADA', label: 'Completada', color: 'primary' },
      { value: 'CANCELADA', label: 'Cancelada', color: 'warn' }
    ]
  };

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
    const estadoActual = this.reserva.estado as keyof typeof this.transicionesEstado;
    this.estadosDisponibles = this.transicionesEstado[estadoActual] || [];
  }

  cambiarEstado(nuevoEstado: string, label: string): void {
    Swal.fire({
      title: `¿Cambiar a ${label}?`,
      text: '¿Deseas agregar observaciones sobre este cambio?',
      input: 'textarea',
      inputPlaceholder: 'Observaciones (opcional)...',
      showCancelButton: true,
      confirmButtonText: 'Confirmar Cambio',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3f51b5',
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
              text: `La reserva ahora está en estado ${label}`,
              confirmButtonColor: '#3f51b5'
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
        this.reservaService.cambiarEstadoReserva(
          this.reserva.id!,
          'CANCELADA',
          undefined,
          result.value
        ).subscribe({
          next: (response) => {
            this.procesando = false;
            Swal.fire({
              icon: 'success',
              title: 'Reserva cancelada',
              text: 'La reserva ha sido cancelada exitosamente',
              confirmButtonColor: '#3f51b5'
            });
            this.cargarReserva(this.reserva.id!);
          },
          error: (error) => {
            this.procesando = false;
            console.error('Error al cancelar:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'No se pudo cancelar la reserva',
              confirmButtonColor: '#dc3545'
            });
          }
        });
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

  formatearFechaCorta(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(precio);
  }

  getEstadoChipClass(estado: string): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'chip-pendiente';
      case 'CONFIRMADA':
        return 'chip-confirmada';
      case 'EN_CURSO':
        return 'chip-en-curso';
      case 'COMPLETADA':
        return 'chip-completada';
      case 'CANCELADA':
        return 'chip-cancelada';
      default:
        return '';
    }
  }

  getEstadoIcon(estado: string): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'schedule';
      case 'CONFIRMADA':
        return 'check_circle';
      case 'EN_CURSO':
        return 'play_circle';
      case 'COMPLETADA':
        return 'done_all';
      case 'CANCELADA':
        return 'cancel';
      default:
        return 'circle';
    }
  }

  calcularDias(): number {
    const inicio = new Date(this.reserva.fechaInicio);
    const fin = new Date(this.reserva.fechaFin);
    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
