import { RecursoImagen } from './recurso-imagen.model';

export interface Cabana {
  id?: number;
  nombre: string;
  descripcion: string;
  precioPorUnidad: number;
  estado: EstadoCabana;
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

export enum EstadoCabana {
  DISPONIBLE = 'DISPONIBLE',
  MANTENIMIENTO = 'MANTENIMIENTO',
  FUERA_SERVICIO = 'FUERA_SERVICIO'
}

export enum TipoCabana {
  ECONOMICA = 'ECONOMICA',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  DELUXE = 'DELUXE'
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
