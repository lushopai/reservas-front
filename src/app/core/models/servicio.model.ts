import { RecursoImagen } from './recurso-imagen.model';

export interface ServicioEntretencion {
  id?: number;
  nombre: string;
  descripcion: string;
  precioPorUnidad: number;
  estado: EstadoServicio;
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

export enum EstadoServicio {
  DISPONIBLE = 'DISPONIBLE',
  MANTENIMIENTO = 'MANTENIMIENTO',
  FUERA_SERVICIO = 'FUERA_SERVICIO'
}

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
