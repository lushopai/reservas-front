import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/environment';
import {
  DisponibilidadCabana,
  BloqueoFechasRequest,
  BloqueHorario,
  BloqueoBloqueRequest,
  GenerarBloquesRequest,
  DisponibilidadResponse
} from '../models/disponibilidad.model';

export interface SuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class DisponibilidadService {
  private apiUrl = `${environment.apiUrl}/api/disponibilidad`;

  constructor(private http: HttpClient) {}

  // ========== CABAÑAS ==========

  /**
   * Consultar si una cabaña está disponible en un rango de fechas
   */
  consultarDisponibilidadCabana(
    cabanaId: number,
    fechaInicio: string,
    fechaFin: string
  ): Observable<DisponibilidadResponse> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get<DisponibilidadResponse>(
      `${this.apiUrl}/cabanas/${cabanaId}`,
      { params }
    );
  }

  /**
   * Obtener calendario de disponibilidad de una cabaña
   */
  obtenerCalendarioCabana(
    cabanaId: number,
    fechaInicio: string,
    fechaFin: string
  ): Observable<DisponibilidadCabana[]> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get<DisponibilidadCabana[]>(
      `${this.apiUrl}/cabanas/${cabanaId}/calendario`,
      { params }
    );
  }

  /**
   * Obtener solo las fechas ocupadas/bloqueadas de una cabaña
   * Retorna array de strings ISO (yyyy-MM-dd)
   */
  obtenerFechasOcupadas(
    cabanaId: number,
    fechaInicio: string,
    fechaFin: string
  ): Observable<string[]> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get<string[]>(
      `${this.apiUrl}/cabanas/${cabanaId}/fechas-ocupadas`,
      { params }
    );
  }

  /**
   * Bloquear fechas de una cabaña manualmente
   */
  bloquearFechasCabana(
    cabanaId: number,
    request: BloqueoFechasRequest
  ): Observable<SuccessResponse<string>> {
    return this.http.post<SuccessResponse<string>>(
      `${this.apiUrl}/cabanas/${cabanaId}/bloquear`,
      request
    );
  }

  /**
   * Desbloquear fechas de una cabaña
   */
  desbloquearFechasCabana(
    cabanaId: number,
    fechaInicio: string,
    fechaFin: string
  ): Observable<SuccessResponse<string>> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.delete<SuccessResponse<string>>(
      `${this.apiUrl}/cabanas/${cabanaId}/desbloquear`,
      { params }
    );
  }

  // ========== SERVICIOS ==========

  /**
   * Obtener bloques horarios disponibles de un servicio
   */
  obtenerBloquesDisponibles(
    servicioId: number,
    fecha: string
  ): Observable<BloqueHorario[]> {
    const params = new HttpParams().set('fecha', fecha);

    return this.http.get<BloqueHorario[]>(
      `${this.apiUrl}/servicios/${servicioId}`,
      { params }
    );
  }

  /**
   * Bloquear bloques horarios de un servicio
   */
  bloquearBloqueServicio(
    servicioId: number,
    request: BloqueoBloqueRequest
  ): Observable<SuccessResponse<string>> {
    return this.http.post<SuccessResponse<string>>(
      `${this.apiUrl}/servicios/${servicioId}/bloquear`,
      request
    );
  }

  /**
   * Generar bloques horarios para un servicio
   */
  generarBloquesHorarios(
    servicioId: number,
    request: GenerarBloquesRequest
  ): Observable<SuccessResponse<string>> {
    return this.http.post<SuccessResponse<string>>(
      `${this.apiUrl}/servicios/${servicioId}/generar-bloques`,
      request
    );
  }
}
