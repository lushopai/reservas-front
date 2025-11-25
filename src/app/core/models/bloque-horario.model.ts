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

export interface GenerarBloquesResponse {
  bloquesCreados: number;        // Cantidad de bloques nuevos creados
  bloquesDuplicados: number;     // Cantidad de bloques que ya existían
  bloquesTotalesGenerados: number; // Total de intentos de creación
  mensaje: string;               // Mensaje descriptivo para el usuario
  exitoso: boolean;              // Si la operación fue exitosa
  detalles?: string;             // Detalles adicionales
  horaAperturaReal?: string;     // Hora de apertura real utilizada (respetando horarios del servicio)
  horaCierreReal?: string;       // Hora de cierre real utilizada (respetando horarios del servicio)
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
