import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export interface ServicioReservaDTO {
  servicioId: number;
  fecha: string;
  horaInicio: string;
  duracionBloques: number;
  // equipamiento removed
}

export interface ItemReservaDTO {
  itemId: number;
  cantidad: number;
}

export interface PaqueteReservaRequest {
  clienteId: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  cabanaId?: number;
  servicioIds?: number[]; // For backward compatibility
  servicios?: ServicioReservaDTO[]; // Full service details
  itemsAdicionales?: ItemReservaDTO[]; // Unified items at package level
  notasEspeciales?: string;
}

export interface PaqueteResponse {
  id: number;
  nombrePaquete: string;
  fechaCreacion: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  precioTotal: number;
  precioFinal: number;
  reservas: any[];
  notasEspeciales?: string;
}

export interface SuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaqueteService {
  private apiUrl = `${API_CONFIG.baseUrl}/api/paquetes`;

  constructor(private http: HttpClient) { }

  /**
   * Crear paquete de reserva (cabaña + servicios)
   */
  crearPaquete(request: PaqueteReservaRequest): Observable<SuccessResponse<PaqueteResponse>> {
    return this.http.post<SuccessResponse<PaqueteResponse>>(this.apiUrl, request);
  }

  /**
   * Obtener paquete por ID
   */
  obtenerPorId(paqueteId: number): Observable<PaqueteResponse> {
    return this.http.get<PaqueteResponse>(`${this.apiUrl}/${paqueteId}`);
  }

  /**
   * Confirmar paquete con pago
   */
  confirmarPaquete(paqueteId: number, pagoRequest: any): Observable<SuccessResponse<PaqueteResponse>> {
    return this.http.put<SuccessResponse<PaqueteResponse>>(
      `${this.apiUrl}/${paqueteId}/confirmar`,
      pagoRequest
    );
  }

  /**
   * Validar que las fechas de servicios estén dentro del rango de cabaña
   */
  validarFechasServicios(
    fechaInicioCabana: Date,
    fechaFinCabana: Date,
    fechaServicio: Date
  ): boolean {
    return fechaServicio >= fechaInicioCabana && fechaServicio <= fechaFinCabana;
  }
}
