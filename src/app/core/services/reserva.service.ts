import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/environment';
import {
  Reserva,
  ReservaCabanaRequest,
  ReservaServicioRequest,
  PagoRequest
} from '../models/reserva.model';

export interface SuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReservaService {
  private apiUrl = `${environment.apiUrl}/api/reservas`;

  constructor(private http: HttpClient) {}

  /**
   * Crear reserva de cabaña
   */
  reservarCabana(request: ReservaCabanaRequest): Observable<SuccessResponse<Reserva>> {
    return this.http.post<SuccessResponse<Reserva>>(
      `${this.apiUrl}/cabana`,
      request
    );
  }

  /**
   * Crear reserva de servicio
   */
  reservarServicio(request: ReservaServicioRequest): Observable<SuccessResponse<Reserva>> {
    return this.http.post<SuccessResponse<Reserva>>(
      `${this.apiUrl}/servicio`,
      request
    );
  }

  /**
   * Confirmar reserva con pago
   */
  confirmarReserva(reservaId: number, pago: PagoRequest): Observable<SuccessResponse<Reserva>> {
    return this.http.put<SuccessResponse<Reserva>>(
      `${this.apiUrl}/${reservaId}/confirmar`,
      pago
    );
  }

  /**
   * Cancelar reserva
   */
  cancelarReserva(reservaId: number, motivo?: string): Observable<SuccessResponse<void>> {
    let params = new HttpParams();
    if (motivo) {
      params = params.set('motivo', motivo);
    }

    return this.http.delete<SuccessResponse<void>>(
      `${this.apiUrl}/${reservaId}`,
      { params }
    );
  }

  /**
   * Obtener reserva por ID
   */
  obtenerPorId(reservaId: number): Observable<Reserva> {
    return this.http.get<Reserva>(`${this.apiUrl}/${reservaId}`);
  }

  /**
   * Obtener reservas de un usuario
   */
  obtenerReservasUsuario(userId: number): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.apiUrl}/cliente/${userId}`);
  }

  /**
   * Obtener todas las reservas (admin)
   */
  obtenerTodas(estado?: string): Observable<Reserva[]> {
    let params = new HttpParams();
    if (estado) {
      params = params.set('estado', estado);
    }

    return this.http.get<Reserva[]>(this.apiUrl, { params });
  }

  /**
   * Cambiar estado de una reserva (admin)
   */
  cambiarEstadoReserva(
    reservaId: number,
    nuevoEstado: string,
    motivo?: string,
    observaciones?: string
  ): Observable<SuccessResponse<Reserva>> {
    return this.http.put<SuccessResponse<Reserva>>(`${this.apiUrl}/${reservaId}/estado`, {
      nuevoEstado,
      motivo,
      observaciones
    });
  }
}
