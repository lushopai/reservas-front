/**
 * Enums sincronizados con el backend
 * Estos valores deben coincidir exactamente con los Enums de Java
 */

// ========================================
// ESTADO DE RECURSOS (Cabañas y Servicios)
// ========================================
export enum EstadoRecurso {
  DISPONIBLE = 'DISPONIBLE',
  MANTENIMIENTO = 'MANTENIMIENTO',
  FUERA_SERVICIO = 'FUERA_SERVICIO'
}

// ========================================
// ESTADO DE RESERVAS
// ========================================
export enum EstadoReserva {
  BORRADOR = 'BORRADOR',
  PENDIENTE_PAGO = 'PENDIENTE_PAGO',
  PENDIENTE = 'PENDIENTE',
  CONFIRMADA = 'CONFIRMADA',
  EN_CURSO = 'EN_CURSO',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA'
}

// ========================================
// ESTADO DE PAQUETES
// ========================================
export enum EstadoPaquete {
  BORRADOR = 'BORRADOR',
  PENDIENTE = 'PENDIENTE',
  ACTIVO = 'ACTIVO',
  EN_CURSO = 'EN_CURSO',
  COMPLETADO = 'COMPLETADO',
  CANCELADO = 'CANCELADO'
}

// ========================================
// TIPO DE RESERVA
// ========================================
export enum TipoReserva {
  CABANA_DIA = 'CABANA_DIA',
  SERVICIO_BLOQUE = 'SERVICIO_BLOQUE'
}

// ========================================
// ESTADO DE ITEMS DE INVENTARIO
// ========================================
export enum EstadoItem {
  NUEVO = 'NUEVO',
  BUENO = 'BUENO',
  REGULAR = 'REGULAR',
  MALO = 'MALO'
}

// ========================================
// CATEGORÍA DE INVENTARIO
// ========================================
export enum CategoriaInventario {
  MUEBLES = 'MUEBLES',
  ELECTRODOMESTICOS = 'ELECTRODOMESTICOS',
  ELECTRONICA = 'ELECTRONICA',
  ROPA_CAMA = 'ROPA_CAMA',
  MENAJE = 'MENAJE',
  DECORACION = 'DECORACION',
  HERRAMIENTAS = 'HERRAMIENTAS',
  EQUIPAMIENTO_DEPORTIVO = 'EQUIPAMIENTO_DEPORTIVO',
  OTROS = 'OTROS'
}

// ========================================
// TIPO DE CABAÑA
// ========================================
export enum TipoCabana {
  ECONOMICA = 'ECONOMICA',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  DELUXE = 'DELUXE'
}

// ========================================
// TIPO DE SERVICIO
// ========================================
export enum TipoServicio {
  CANCHA_TENIS = 'CANCHA_TENIS',
  CANCHA_FUTBOL = 'CANCHA_FUTBOL',
  PISCINA = 'PISCINA',
  QUINCHO = 'QUINCHO',
  SPA = 'SPA',
  GIMNASIO = 'GIMNASIO',
  SALA_JUEGOS = 'SALA_JUEGOS',
  SALON_EVENTOS = 'SALON_EVENTOS'
}

// ========================================
// HELPERS - Funciones útiles para trabajar con Enums
// ========================================

/**
 * Convierte un EstadoReserva a un color de badge para la UI
 */
export function getEstadoReservaColor(estado: EstadoReserva): string {
  switch (estado) {
    case EstadoReserva.BORRADOR:
      return 'secondary';
    case EstadoReserva.PENDIENTE_PAGO:
      return 'warning';
    case EstadoReserva.PENDIENTE:
      return 'warning';
    case EstadoReserva.CONFIRMADA:
      return 'success';
    case EstadoReserva.EN_CURSO:
      return 'info';
    case EstadoReserva.COMPLETADA:
      return 'primary';
    case EstadoReserva.CANCELADA:
      return 'danger';
    default:
      return 'secondary';
  }
}

/**
 * Convierte un EstadoPaquete a un color de badge para la UI
 */
export function getEstadoPaqueteColor(estado: EstadoPaquete): string {
  switch (estado) {
    case EstadoPaquete.BORRADOR:
      return 'secondary';
    case EstadoPaquete.PENDIENTE:
      return 'warning';
    case EstadoPaquete.ACTIVO:
      return 'success';
    case EstadoPaquete.EN_CURSO:
      return 'info';
    case EstadoPaquete.COMPLETADO:
      return 'primary';
    case EstadoPaquete.CANCELADO:
      return 'danger';
    default:
      return 'secondary';
  }
}

/**
 * Convierte un EstadoRecurso a un color de badge para la UI
 */
export function getEstadoRecursoColor(estado: EstadoRecurso): string {
  switch (estado) {
    case EstadoRecurso.DISPONIBLE:
      return 'success';
    case EstadoRecurso.MANTENIMIENTO:
      return 'warning';
    case EstadoRecurso.FUERA_SERVICIO:
      return 'danger';
    default:
      return 'secondary';
  }
}

/**
 * Convierte un EstadoItem a un color de badge para la UI
 */
export function getEstadoItemColor(estado: EstadoItem): string {
  switch (estado) {
    case EstadoItem.NUEVO:
      return 'success';
    case EstadoItem.BUENO:
      return 'primary';
    case EstadoItem.REGULAR:
      return 'warning';
    case EstadoItem.MALO:
      return 'danger';
    default:
      return 'secondary';
  }
}

/**
 * Obtiene todos los valores de un Enum como array
 */
export function getEnumValues<T>(enumObj: any): T[] {
  return Object.values(enumObj);
}

/**
 * Obtiene label en español para EstadoReserva
 */
export function getEstadoReservaLabel(estado: EstadoReserva): string {
  const labels: Record<EstadoReserva, string> = {
    [EstadoReserva.BORRADOR]: 'Borrador',
    [EstadoReserva.PENDIENTE_PAGO]: 'Pendiente de Pago',
    [EstadoReserva.PENDIENTE]: 'Pendiente',
    [EstadoReserva.CONFIRMADA]: 'Confirmada',
    [EstadoReserva.EN_CURSO]: 'En Curso',
    [EstadoReserva.COMPLETADA]: 'Completada',
    [EstadoReserva.CANCELADA]: 'Cancelada'
  };
  return labels[estado] || estado;
}

/**
 * Obtiene label en español para EstadoPaquete
 */
export function getEstadoPaqueteLabel(estado: EstadoPaquete): string {
  const labels: Record<EstadoPaquete, string> = {
    [EstadoPaquete.BORRADOR]: 'Borrador',
    [EstadoPaquete.PENDIENTE]: 'Pendiente de Pago',
    [EstadoPaquete.ACTIVO]: 'Confirmado',
    [EstadoPaquete.EN_CURSO]: 'En Curso',
    [EstadoPaquete.COMPLETADO]: 'Completado',
    [EstadoPaquete.CANCELADO]: 'Cancelado'
  };
  return labels[estado] || estado;
}

/**
 * Obtiene label en español para EstadoRecurso
 */
export function getEstadoRecursoLabel(estado: EstadoRecurso): string {
  const labels: Record<EstadoRecurso, string> = {
    [EstadoRecurso.DISPONIBLE]: 'Disponible',
    [EstadoRecurso.MANTENIMIENTO]: 'En Mantenimiento',
    [EstadoRecurso.FUERA_SERVICIO]: 'Fuera de Servicio'
  };
  return labels[estado] || estado;
}

/**
 * Obtiene label en español para EstadoItem
 */
export function getEstadoItemLabel(estado: EstadoItem): string {
  const labels: Record<EstadoItem, string> = {
    [EstadoItem.NUEVO]: 'Nuevo',
    [EstadoItem.BUENO]: 'Bueno',
    [EstadoItem.REGULAR]: 'Regular',
    [EstadoItem.MALO]: 'Malo'
  };
  return labels[estado] || estado;
}
