import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Reserva, EstadoReserva, EstadoPaquete } from '../../../../../core/models/reserva.model';

export interface ReservaDisplayDialog {
  id?: number;
  esPaquete: boolean;
  paqueteId?: number;
  nombrePaquete?: string;
  reservas: Reserva[];
  nombreRecurso?: string;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoReserva;
  precioTotal: number;
  tipoReserva?: string;
}

@Component({
  selector: 'app-detalle-reserva-dialog',
  templateUrl: './detalle-reserva-dialog.component.html',
  styleUrls: ['./detalle-reserva-dialog.component.scss']
})
export class DetalleReservaDialogComponent {
  estadosReserva = EstadoReserva;

  constructor(
    public dialogRef: MatDialogRef<DetalleReservaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReservaDisplayDialog
  ) {}

  getEstadoLabel(estado: EstadoReserva | EstadoPaquete | string): string {
    switch (estado) {
      case EstadoReserva.PENDIENTE_PAGO:
      case EstadoPaquete.PENDIENTE:
        return 'Pendiente de Pago';
      case EstadoReserva.PENDIENTE:
        return 'Pendiente';
      case EstadoReserva.CONFIRMADA:
      case EstadoPaquete.ACTIVO:
        return 'Confirmada';
      case EstadoReserva.EN_CURSO:
        return 'En Curso';
      case EstadoReserva.COMPLETADA:
      case EstadoPaquete.COMPLETADO:
        return 'Completada';
      case EstadoReserva.CANCELADA:
      case EstadoPaquete.CANCELADO:
        return 'Cancelada';
      default:
        return estado;
    }
  }

  getEstadoColor(estado: EstadoReserva | EstadoPaquete): string {
    // Handle both EstadoReserva and EstadoPaquete
    if (estado === EstadoReserva.PENDIENTE_PAGO || estado === EstadoPaquete.PENDIENTE) {
      return 'warn';
    }
    if (estado === EstadoReserva.CONFIRMADA || estado === EstadoPaquete.ACTIVO) {
      return 'accent';
    }
    if (estado === EstadoReserva.COMPLETADA || estado === EstadoPaquete.COMPLETADO) {
      return 'primary';
    }
    if (estado === EstadoReserva.CANCELADA || estado === EstadoPaquete.CANCELADO) {
      return '';
    }
    return 'primary';
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
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
    return tipo === 'CABANA_DIA' ? 'Cabaña' : 'Servicio';
  }

  mapEstadoPaqueteToEstadoReserva(estadoPaquete?: EstadoPaquete): EstadoReserva | undefined {
    if (!estadoPaquete) return undefined;
    switch (estadoPaquete) {
      case EstadoPaquete.PENDIENTE:
        return EstadoReserva.PENDIENTE;
      case EstadoPaquete.ACTIVO:
        return EstadoReserva.CONFIRMADA;
      case EstadoPaquete.CANCELADO:
        return EstadoReserva.CANCELADA;
      case EstadoPaquete.COMPLETADO:
        return EstadoReserva.COMPLETADA;
      default:
        return undefined;
    }
  }

  getStateForDisplay(reserva: Reserva): EstadoReserva {
    // Si está en un paquete y tiene estadoPaquete, usarlo
    if (reserva.paqueteId && reserva.estadoPaquete) {
      return this.mapEstadoPaqueteToEstadoReserva(reserva.estadoPaquete) || reserva.estado;
    }
    return reserva.estado;
  }
}
