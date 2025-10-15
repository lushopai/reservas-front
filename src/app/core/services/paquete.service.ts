import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export interface ServicioReservaDTO {
  servicioId: number;
  fecha: string;
  horaInicio: string;
  duracionBloques: number;
  equipamiento?: ItemReservaDTO[];
}

export interface ItemReservaDTO {
  itemId: number;
  cantidad: number;
}

export interface PaqueteReservaRequest {
  clienteId: number;
  nombre: string; // Backend espera 'nombre', no 'nombrePaquete'
  fechaInicio: string;
  fechaFin: string;
  cabanaId?: number;
  itemsCabana?: ItemReservaDTO[]; // Backend espera 'itemsCabana', no 'itemsAdicionales'
  servicios?: ServicioReservaDTO[];
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
  descuento: number;
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

  constructor(private http: HttpClient) {}

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
   * Calcular descuento sugerido por cantidad de servicios
   */
  calcularDescuentoSugerido(cantidadServicios: number): number {
    if (cantidadServicios >= 5) {
      return 20; // 20% de descuento por 5 o más servicios
    } else if (cantidadServicios >= 3) {
      return 15; // 15% de descuento por 3-4 servicios
    } else if (cantidadServicios >= 2) {
      return 10; // 10% de descuento por 2 servicios
    }
    return 0;
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
