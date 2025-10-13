// Estados de Reserva
export enum EstadoReserva {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADA = 'CONFIRMADA',
  CANCELADA = 'CANCELADA',
  COMPLETADA = 'COMPLETADA'
}

// Tipos de Reserva
export enum TipoReserva {
  CABANA_DIA = 'CABANA_DIA',
  SERVICIO_BLOQUE = 'SERVICIO_BLOQUE'
}

// Item Reservado
export interface ItemReservado {
  id?: number;
  itemId: number;
  nombreItem?: string;
  cantidad: number;
  precioUnitario?: number;
  subtotal?: number;
}

// Reserva
export interface Reserva {
  id?: number;
  userId: number;
  nombreUsuario?: string;
  emailUsuario?: string;
  recursoId: number;
  nombreRecurso?: string;
  tipoRecurso?: string;
  fechaReserva?: string;
  fechaInicio: string;
  fechaFin: string;
  tipoReserva: TipoReserva;
  estado: EstadoReserva;
  precioBase: number;
  precioItems: number;
  precioTotal: number;
  itemsReservados?: ItemReservado[];
  observaciones?: string;
}

// Request para Reservar Cabaña
export interface ReservaCabanaRequest {
  cabanaId: number;
  clienteId: number;
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string;
  itemsAdicionales?: ItemReservaDTO[];
  observaciones?: string;
}

// Request para Reservar Servicio
export interface ReservaServicioRequest {
  servicioId: number;
  clienteId: number;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm
  duracionBloques: number;
  equipamiento?: ItemReservaDTO[];
  observaciones?: string;
}

// DTO para items
export interface ItemReservaDTO {
  itemId: number;
  cantidad: number;
}

// Request de Pago
export interface PagoRequest {
  metodoPago: string; // TARJETA, TRANSFERENCIA, EFECTIVO
  monto: number;
  numeroTarjeta?: string;
  nombreTitular?: string;
  fechaVencimiento?: string;
  cvv?: string;
  comprobanteTransferencia?: string;
}
