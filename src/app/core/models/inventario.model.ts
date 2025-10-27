import { CategoriaInventario, EstadoItem } from './enums.model';

// Re-exportar para compatibilidad con imports existentes
export { CategoriaInventario, EstadoItem };

export interface ItemInventario {
  id: number;
  recursoId: number;
  nombreRecurso: string;
  nombre: string;
  categoria: CategoriaInventario;
  cantidadTotal: number;
  cantidadDisponible?: number;
  estadoItem: EstadoItem;  // Ahora usa: NUEVO, BUENO, REGULAR, MALO (actualizado con backend)
  esReservable: boolean;
  precioReserva: number;
}

export interface ItemInventarioRequest {
  recursoId: number;
  nombre: string;
  categoria: CategoriaInventario;
  cantidadTotal: number;
  estadoItem: EstadoItem;  // Ahora usa: NUEVO, BUENO, REGULAR, MALO (actualizado con backend)
  esReservable: boolean;
  precioReserva: number;
}
