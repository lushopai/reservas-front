// Disponibilidad de Cabañas
export interface DisponibilidadCabana {
  id?: number;
  cabanaId: number;
  nombreCabana?: string;
  fecha: string; // LocalDate as ISO string
  disponible: boolean;
  motivoNoDisponible?: string;
  precioEspecial?: number;
}

export interface BloqueoFechasRequest {
  fechaInicio: string; // LocalDate as ISO string
  fechaFin: string;
  motivo?: string;
  precioEspecial?: number;
}

// Bloques Horarios de Servicios
export interface BloqueHorario {
  id: number;
  servicioId?: number;
  nombreServicio?: string;
  fecha: string; // LocalDate as ISO string
  horaInicio: string; // LocalTime as HH:mm:ss
  horaFin: string;
  disponible: boolean;
  motivoNoDisponible?: string;
}

export interface BloqueoBloqueRequest {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo?: string;
}

export interface GenerarBloquesRequest {
  fecha: string;
  horaApertura: string;
  horaCierre: string;
  duracionBloqueMinutos: number;
}

// Response genérico de disponibilidad
export interface DisponibilidadResponse {
  disponible: boolean;
  motivo?: string;
}

// Helper para calendario
export interface DiaCalendario {
  fecha: Date;
  disponible: boolean;
  esHoy: boolean;
  esPasado: boolean;
  motivo?: string;
  precioEspecial?: number;
}
