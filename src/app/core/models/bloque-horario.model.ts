export interface BloqueHorario {
  id?: number;
  servicioId?: number;
  nombreServicio?: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
  motivoNoDisponible?: string;
  reservaId?: number;
}

export interface GenerarBloquesRequest {
  fechaInicio: string;
  fechaFin: string;
  horaApertura: string;
  horaCierre: string;
  duracionBloqueMinutos: number;
  diasSemana?: number[]; // 0=Domingo, 1=Lunes, ..., 6=Sábado
}

export interface BloqueoBloqueRequest {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo?: string;
}

export interface EstadisticasBloques {
  totalBloques: number;
  bloquesDisponibles: number;
  bloquesOcupados: number;
  bloquesBloqueados: number;
  porcentajeOcupacion: number;
}
