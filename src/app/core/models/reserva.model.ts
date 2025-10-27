import { EstadoReserva, EstadoPaquete, TipoReserva } from './enums.model';

// Re-exportar para compatibilidad con imports existentes
export { EstadoReserva, EstadoPaquete, TipoReserva };

// Item Reservado
export interface ItemReservado {
  id?: number;
  itemId: number;
  nombreItem?: string;
  categoria?: string;
  cantidad: number;
  precioUnitario?: number;
  subtotal?: number;
}

// Resumen de reserva (para mostrar en el desglose del paquete)
export interface ReservaResumen {
  id: number;
  nombreRecurso: string;
  tipoReserva: string;
  precioBase: number;
  precioItems: number;
  precioTotal: number;
  cantidadItems: number;
}

// Recurso simplificado
export interface RecursoSimple {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo: string;
  precioPorUnidad: number;
  capacidadPersonas?: number;
  numeroHabitaciones?: number;
  duracionBloqueMinutos?: number;
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
  recurso?: RecursoSimple;
  fechaReserva?: string;
  fechaInicio: string;
  fechaFin: string;
  tipoReserva: TipoReserva;
  estado: EstadoReserva;  // Estado de la reserva individual
  precioBase: number;
  precioItems: number;
  precioTotal: number;
  itemsReservados?: ItemReservado[];
  observaciones?: string;

  // Package information
  paqueteId?: number;
  nombrePaquete?: string;
  estadoPaquete?: EstadoPaquete;  // Ahora usa EstadoPaquete correcto: BORRADOR, CONFIRMADO, CANCELADO, COMPLETADO

  // Precios del paquete completo
  precioTotalPaquete?: number;  // Suma de todas las reservas
  descuentoPaquete?: number;     // Descuento aplicado
  precioFinalPaquete?: number;   // Total con descuento

  // Lista de reservas del paquete (para desglose completo)
  reservasPaquete?: ReservaResumen[];
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

// Paquete de Reserva
export interface PaqueteReserva {
  id?: number;
  userId: number;
  nombreUsuario?: string;
  emailUsuario?: string;
  nombrePaquete: string;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoPaquete;  // Usa EstadoPaquete del backend
  precioTotal: number;
  descuento: number;
  precioFinal: number;
  observaciones?: string;
  reservas?: Reserva[];
}

// Request para crear Paquete
export interface PaqueteReservaRequest {
  userId: number;
  nombrePaquete: string;
  fechaInicio: string;
  fechaFin: string;
  reservas: Array<{
    recursoId: number;
    fechaInicio: string;
    fechaFin: string;
    tipoReserva: TipoReserva;
    itemsReservados?: ItemReservaDTO[];
  }>;
  observaciones?: string;
}
