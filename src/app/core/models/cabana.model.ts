import { RecursoImagen } from './recurso-imagen.model';
import { EstadoRecurso, TipoCabana } from './enums.model';

// Re-exportar para compatibilidad con imports existentes
export { EstadoRecurso, TipoCabana };

export interface Cabana {
  id?: number;
  nombre: string;
  descripcion: string;
  precioPorUnidad: number;
  estado: EstadoRecurso;  // Cambiado de EstadoCabana a EstadoRecurso (unificado con backend)
  capacidadPersonas: number;
  numeroHabitaciones: number;
  numeroBanos: number;
  metrosCuadrados: number;
  tipoCabana: TipoCabana;
  serviciosIncluidos?: string;
  totalReservas?: number;
  disponibleHoy?: boolean;
  itemsInventario?: number;
  imagenes?: RecursoImagen[];
  imagenPrincipalUrl?: string;
}

// @deprecated Usar EstadoRecurso de enums.model.ts
export enum EstadoCabana {
  DISPONIBLE = 'DISPONIBLE',
  MANTENIMIENTO = 'MANTENIMIENTO',
  FUERA_SERVICIO = 'FUERA_SERVICIO'
}

export interface CabanaRequest {
  nombre: string;
  descripcion: string;
  precioPorUnidad: number;
  estado: string;
  capacidadPersonas: number;
  numeroHabitaciones: number;
  numeroBanos: number;
  metrosCuadrados: number;
  tipoCabana: string;
  serviciosIncluidos?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
