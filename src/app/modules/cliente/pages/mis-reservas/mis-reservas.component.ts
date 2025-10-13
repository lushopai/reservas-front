import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ReservaService } from '../../../../core/services/reserva.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Reserva, EstadoReserva } from '../../../../core/models/reserva.model';

@Component({
  selector: 'app-mis-reservas',
  templateUrl: './mis-reservas.component.html',
  styleUrls: ['./mis-reservas.component.scss']
})
export class MisReservasComponent implements OnInit {
  reservas: Reserva[] = [];
  reservasFiltradas: Reserva[] = [];
  filtroEstado: string = '';
  cargando = false;

  estadosReserva = Object.values(EstadoReserva);

  constructor(
    private reservaService: ReservaService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarReservas();
  }

  cargarReservas(): void {
    const user = this.authService.getCurrentUser();
    if (!user || !user.id) {
      Swal.fire('Error', 'Debe iniciar sesión para ver sus reservas', 'error');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.cargando = true;
    this.reservaService.obtenerReservasUsuario(user.id).subscribe({
      next: (data) => {
        this.reservas = data;
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar reservas:', error);
        Swal.fire('Error', 'No se pudieron cargar las reservas', 'error');
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.reservasFiltradas = this.reservas.filter(reserva => {
      const cumpleEstado = !this.filtroEstado || reserva.estado === this.filtroEstado;
      return cumpleEstado;
    });

    // Ordenar por fecha más reciente primero
    this.reservasFiltradas.sort((a, b) => {
      return new Date(b.fechaReserva || b.fechaInicio).getTime() -
             new Date(a.fechaReserva || a.fechaInicio).getTime();
    });
  }

  nuevaReserva(): void {
    this.router.navigate(['/cliente/nueva-reserva']);
  }

  verDetalle(reserva: Reserva): void {
    // Por ahora solo mostrar info en modal
    Swal.fire({
      title: `Reserva #${reserva.id}`,
      html: `
        <div class="text-start">
          <p><strong>Recurso:</strong> ${reserva.nombreRecurso}</p>
          <p><strong>Tipo:</strong> ${this.formatearTipo(reserva.tipoReserva)}</p>
          <p><strong>Inicio:</strong> ${this.formatearFecha(reserva.fechaInicio)}</p>
          <p><strong>Fin:</strong> ${this.formatearFecha(reserva.fechaFin)}</p>
          <p><strong>Total:</strong> ${this.formatearPrecio(reserva.precioTotal)}</p>
          <p><strong>Estado:</strong> <span class="badge ${this.getBadgeClass(reserva.estado)}">${reserva.estado}</span></p>
          ${reserva.observaciones ? `<p><strong>Observaciones:</strong> ${reserva.observaciones}</p>` : ''}
        </div>
      `,
      confirmButtonText: 'Cerrar'
    });
  }

  cancelarReserva(reserva: Reserva): void {
    if (reserva.estado !== EstadoReserva.PENDIENTE && reserva.estado !== EstadoReserva.CONFIRMADA) {
      Swal.fire('No permitido', 'Solo se pueden cancelar reservas pendientes o confirmadas', 'warning');
      return;
    }

    Swal.fire({
      title: '¿Cancelar reserva?',
      text: `¿Está seguro de cancelar la reserva #${reserva.id}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
      input: 'textarea',
      inputLabel: 'Motivo de cancelación (opcional)',
      inputPlaceholder: 'Escriba el motivo...'
    }).then((result) => {
      if (result.isConfirmed && reserva.id) {
        this.reservaService.cancelarReserva(reserva.id, result.value).subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire('Cancelada', response.message, 'success');
              this.cargarReservas();
            }
          },
          error: (error) => {
            console.error('Error al cancelar:', error);
            Swal.fire('Error', 'No se pudo cancelar la reserva', 'error');
          }
        });
      }
    });
  }

  getBadgeClass(estado: string): string {
    switch (estado) {
      case EstadoReserva.PENDIENTE:
        return 'bg-warning';
      case EstadoReserva.CONFIRMADA:
        return 'bg-success';
      case EstadoReserva.CANCELADA:
        return 'bg-danger';
      case EstadoReserva.COMPLETADA:
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
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

  formatearTipo(tipo: string): string {
    return tipo === 'CABANA_DIA' ? 'Cabaña por días' : 'Servicio por bloques';
  }
}
