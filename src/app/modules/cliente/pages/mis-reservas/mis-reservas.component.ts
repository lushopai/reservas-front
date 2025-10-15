import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ReservaService } from '../../../../core/services/reserva.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PagoService, PagoRequest } from '../../../../core/services/pago.service';
import { Reserva, EstadoReserva } from '../../../../core/models/reserva.model';

// Interface for grouped package display
interface GrupoReserva {
  tipo: 'individual' | 'paquete';
  reserva?: Reserva; // For individual reservations
  paqueteId?: number; // For package groups
  nombrePaquete?: string;
  reservasPaquete?: Reserva[]; // All reservations in the package
  precioTotal?: number;
  estado?: string; // Overall package state
  fechaMasReciente?: string;
}

@Component({
  selector: 'app-mis-reservas',
  templateUrl: './mis-reservas.component.html',
  styleUrls: ['./mis-reservas.component.scss']
})
export class MisReservasComponent implements OnInit {
  reservas: Reserva[] = [];
  reservasFiltradas: Reserva[] = [];
  gruposReservas: GrupoReserva[] = [];
  filtroEstado: string = '';
  cargando = false;

  estadosReserva = Object.values(EstadoReserva);

  constructor(
    private reservaService: ReservaService,
    private authService: AuthService,
    private pagoService: PagoService,
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

    // Group reservations by package
    this.agruparReservas();
  }

  /**
   * Groups reservations: packages together, individual reservations separate
   */
  agruparReservas(): void {
    this.gruposReservas = [];
    const paquetesMap = new Map<number, Reserva[]>();
    const individuales: Reserva[] = [];

    // Separate package reservations from individual ones
    for (const reserva of this.reservasFiltradas) {
      if (reserva.paqueteId) {
        // It's part of a package
        if (!paquetesMap.has(reserva.paqueteId)) {
          paquetesMap.set(reserva.paqueteId, []);
        }
        paquetesMap.get(reserva.paqueteId)!.push(reserva);
      } else {
        // It's an individual reservation
        individuales.push(reserva);
      }
    }

    // Create package groups
    paquetesMap.forEach((reservasPaquete, paqueteId) => {
      const precioTotal = reservasPaquete.reduce((sum, r) => sum + r.precioTotal, 0);

      // Determine overall package state (use the "worst" state)
      const estados = reservasPaquete.map(r => r.estado);
      let estado = EstadoReserva.COMPLETADA;
      if (estados.includes(EstadoReserva.CANCELADA)) {
        estado = EstadoReserva.CANCELADA;
      } else if (estados.includes(EstadoReserva.PENDIENTE)) {
        estado = EstadoReserva.PENDIENTE;
      } else if (estados.includes(EstadoReserva.EN_CURSO)) {
        estado = EstadoReserva.EN_CURSO;
      } else if (estados.includes(EstadoReserva.CONFIRMADA)) {
        estado = EstadoReserva.CONFIRMADA;
      }

      // Get most recent date
      const fechas = reservasPaquete.map(r => new Date(r.fechaReserva || r.fechaInicio).getTime());
      const fechaMasReciente = new Date(Math.max(...fechas)).toISOString();

      this.gruposReservas.push({
        tipo: 'paquete',
        paqueteId,
        nombrePaquete: reservasPaquete[0].nombrePaquete || `Paquete #${paqueteId}`,
        reservasPaquete,
        precioTotal,
        estado,
        fechaMasReciente
      });
    });

    // Create individual reservation groups
    for (const reserva of individuales) {
      this.gruposReservas.push({
        tipo: 'individual',
        reserva
      });
    }

    // Sort groups by most recent date
    this.gruposReservas.sort((a, b) => {
      const fechaA = a.tipo === 'paquete' ? a.fechaMasReciente! : (a.reserva!.fechaReserva || a.reserva!.fechaInicio);
      const fechaB = b.tipo === 'paquete' ? b.fechaMasReciente! : (b.reserva!.fechaReserva || b.reserva!.fechaInicio);
      return new Date(fechaB).getTime() - new Date(fechaA).getTime();
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

  verDetallePaquete(grupo: GrupoReserva): void {
    const reservasHtml = grupo.reservasPaquete!.map(reserva => `
      <div class="border rounded p-2 mb-2">
        <h6>${reserva.nombreRecurso}</h6>
        <p class="mb-1"><strong>Tipo:</strong> ${this.formatearTipo(reserva.tipoReserva)}</p>
        <p class="mb-1"><strong>Inicio:</strong> ${this.formatearFecha(reserva.fechaInicio)}</p>
        <p class="mb-1"><strong>Fin:</strong> ${this.formatearFecha(reserva.fechaFin)}</p>
        <p class="mb-1"><strong>Precio:</strong> ${this.formatearPrecio(reserva.precioTotal)}</p>
        <p class="mb-0"><strong>Estado:</strong> <span class="badge ${this.getBadgeClass(reserva.estado)}">${reserva.estado}</span></p>
      </div>
    `).join('');

    Swal.fire({
      title: `${grupo.nombrePaquete}`,
      html: `
        <div class="text-start">
          <p class="mb-3"><strong>Reservas incluidas en el paquete:</strong></p>
          ${reservasHtml}
          <hr>
          <p class="text-end mb-0">
            <strong class="text-success">Total Paquete: ${this.formatearPrecio(grupo.precioTotal!)}</strong>
          </p>
        </div>
      `,
      width: '700px',
      confirmButtonText: 'Cerrar'
    });
  }

  pagarReserva(reserva: Reserva): void {
    if (reserva.estado !== EstadoReserva.PENDIENTE) {
      Swal.fire('No disponible', 'Solo se pueden pagar reservas pendientes', 'warning');
      return;
    }

    // Mostrar modal de selección de método de pago
    Swal.fire({
      title: 'Procesar Pago',
      html: `
        <div class="text-start">
          <p class="mb-3"><strong>Reserva:</strong> ${reserva.nombreRecurso}</p>
          <p class="mb-3"><strong>Monto a pagar:</strong> <span class="text-success fw-bold">${this.formatearPrecio(reserva.precioTotal)}</span></p>

          <label class="form-label"><strong>Seleccione método de pago:</strong></label>
          <select id="metodoPago" class="form-select mb-3">
            <option value="TARJETA">Tarjeta de Crédito/Débito</option>
            <option value="TRANSFERENCIA">Transferencia Bancaria</option>
            <option value="EFECTIVO">Efectivo</option>
            <option value="WEBPAY">WebPay</option>
          </select>

          <label class="form-label"><strong>Número de referencia/transacción (opcional):</strong></label>
          <input id="transaccionId" type="text" class="form-control" placeholder="Ej: TRX123456">

          <p class="text-muted small mt-3">
            <i class="bi bi-info-circle"></i>
            Al procesar el pago, su reserva será confirmada automáticamente.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Procesar Pago',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      preConfirm: () => {
        const metodoPago = (document.getElementById('metodoPago') as HTMLSelectElement).value;
        const transaccionId = (document.getElementById('transaccionId') as HTMLInputElement).value;

        if (!metodoPago) {
          Swal.showValidationMessage('Debe seleccionar un método de pago');
          return false;
        }

        return {
          metodoPago: metodoPago as any,
          transaccionId: transaccionId || undefined
        };
      }
    }).then((result) => {
      if (result.isConfirmed && reserva.id) {
        const pagoRequest: PagoRequest = {
          monto: reserva.precioTotal,
          metodoPago: result.value.metodoPago,
          transaccionId: result.value.transaccionId
        };

        // Mostrar loading
        Swal.fire({
          title: 'Procesando pago...',
          html: 'Por favor espere',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.pagoService.procesarPagoReserva(reserva.id, pagoRequest).subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire({
                icon: 'success',
                title: 'Pago Exitoso',
                html: `
                  <p>Su pago ha sido procesado correctamente.</p>
                  <p><strong>ID de Pago:</strong> #${response.data.id}</p>
                  <p><strong>Método:</strong> ${response.data.metodoPago}</p>
                  <p>Su reserva ha sido confirmada.</p>
                `,
                confirmButtonText: 'Aceptar'
              }).then(() => {
                this.cargarReservas(); // Recargar lista
              });
            }
          },
          error: (error) => {
            console.error('Error al procesar pago:', error);
            const mensaje = error.error?.message || 'No se pudo procesar el pago';
            Swal.fire('Error', mensaje, 'error');
          }
        });
      }
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
