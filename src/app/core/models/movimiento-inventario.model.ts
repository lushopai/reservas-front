export enum TipoMovimiento {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
  DEVOLUCION = 'DEVOLUCION',
  AJUSTE_POSITIVO = 'AJUSTE_POSITIVO',
  AJUSTE_NEGATIVO = 'AJUSTE_NEGATIVO',
  PERDIDA = 'PERDIDA',
  DANO = 'DANO'
}

export interface MovimientoInventario {
  id: number;

  // Información del item
  itemId: number;
  nombreItem: string;
  categoriaItem?: string;

  // Información del movimiento
  tipoMovimiento: TipoMovimiento;
  cantidad: number;
  fechaMovimiento: string;

  // Stock
  stockAnterior: number;
  stockPosterior: number;

  // Información de la reserva (si aplica)
  reservaId?: number;
  nombreRecurso?: string;

  // Información del usuario
  usuarioId?: number;
  nombreUsuario?: string;

  // Observaciones
  observaciones?: string;
}

export interface MovimientoEstadisticas {
  totalEntradas: number;
  totalSalidas: number;
  totalDevoluciones: number;
  totalAjustes: number;
}
