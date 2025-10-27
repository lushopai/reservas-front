import { RecursoImagen } from './recurso-imagen.model';
import { EstadoRecurso, TipoServicio } from './enums.model';

// Re-exportar para compatibilidad con imports existentes
export { EstadoRecurso, TipoServicio };

export interface ServicioEntretencion {
  id?: number;
  nombre: string;
  descripcion: string;
  precioPorUnidad: number;
  estado: EstadoRecurso;  // Cambiado de EstadoServicio a EstadoRecurso (unificado con backend)
  tipoServicio: TipoServicio;
  capacidadMaxima: number;
  duracionBloqueMinutos: number;
  requiereSupervision: boolean;
  totalReservas?: number;
  disponibleHoy?: boolean;
  bloquesDisponibles?: number;
  itemsInventario?: number;
  imagenes?: RecursoImagen[];
  imagenPrincipalUrl?: string;
}

// @deprecated Usar EstadoRecurso de enums.model.ts
export enum EstadoServicio {
  DISPONIBLE = 'DISPONIBLE',
  MANTENIMIENTO = 'MANTENIMIENTO',
  FUERA_SERVICIO = 'FUERA_SERVICIO'
}

export interface ServicioRequest {
  nombre: string;
  descripcion: string;
  precioPorUnidad: number;
  estado: string;
  tipoServicio: string;
  capacidadMaxima: number;
  duracionBloqueMinutos: number;
  requiereSupervision: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
