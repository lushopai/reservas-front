import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/environment';
import { BloqueHorario, GenerarBloquesRequest, BloqueoBloqueRequest } from '../models/bloque-horario.model';

@Injectable({
  providedIn: 'root'
})
export class BloqueHorarioService {
  private apiUrl = `${environment.apiUrl}/api/disponibilidad`;

  constructor(private http: HttpClient) { }

  /**
   * Obtener bloques disponibles de un servicio en una fecha
   */
  obtenerBloquesPorFecha(servicioId: number, fecha: string): Observable<BloqueHorario[]> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get<BloqueHorario[]>(`${this.apiUrl}/servicios/${servicioId}`, { params });
  }

  /**
   * Generar bloques horarios para un servicio en una fecha
   */
  generarBloques(servicioId: number, request: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/servicios/${servicioId}/generar-bloques`, request);
  }

  /**
   * Generar bloques horarios masivamente (para m�ltiples d�as)
   */
  generarBloquesMasivo(servicioId: number, request: GenerarBloquesRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/servicios/${servicioId}/generar-bloques-masivo`, request);
  }

  /**
   * Bloquear un bloque horario espec�fico
   */
  bloquearBloque(servicioId: number, request: BloqueoBloqueRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/servicios/${servicioId}/bloquear`, request);
  }

  /**
   * Desbloquear un bloque horario
   */
  desbloquearBloque(bloqueId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/bloques/${bloqueId}/desbloquear`);
  }

  /**
   * Eliminar un bloque horario
   */
  eliminarBloque(bloqueId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/bloques/${bloqueId}`);
  }

  /**
   * Obtener bloques por rango de fechas
   */
  obtenerBloquesPorRango(servicioId: number, fechaInicio: string, fechaFin: string): Observable<BloqueHorario[]> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);
    return this.http.get<BloqueHorario[]>(`${this.apiUrl}/servicios/${servicioId}/rango`, { params });
  }
}
