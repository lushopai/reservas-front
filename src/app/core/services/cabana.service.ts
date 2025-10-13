import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cabana, CabanaRequest, ApiResponse } from '../models/cabana.model';
import { environment } from '../../../../enviroments/environment';

@Injectable({
  providedIn: 'root'
})
export class CabanaService {

  private apiUrl = `${environment.apiUrl}/api/cabanas`;

  constructor(private http: HttpClient) { }

  /**
   * Crear nueva cabaña
   */
  crearCabana(cabana: CabanaRequest): Observable<ApiResponse<Cabana>> {
    return this.http.post<ApiResponse<Cabana>>(this.apiUrl, cabana);
  }

  /**
   * Obtener todas las cabañas
   */
  obtenerTodas(): Observable<Cabana[]> {
    return this.http.get<Cabana[]>(this.apiUrl);
  }

  /**
   * Obtener cabañas por estado
   */
  obtenerPorEstado(estado: string): Observable<Cabana[]> {
    const params = new HttpParams().set('estado', estado);
    return this.http.get<Cabana[]>(this.apiUrl, { params });
  }

  /**
   * Obtener cabañas disponibles en un rango de fechas
   */
  obtenerDisponibles(fechaInicio: string, fechaFin: string): Observable<Cabana[]> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);
    return this.http.get<Cabana[]>(this.apiUrl, { params });
  }

  /**
   * Obtener cabaña por ID
   */
  obtenerPorId(id: number): Observable<Cabana> {
    return this.http.get<Cabana>(`${this.apiUrl}/${id}`);
  }

  /**
   * Actualizar cabaña
   */
  actualizarCabana(id: number, cabana: CabanaRequest): Observable<ApiResponse<Cabana>> {
    return this.http.put<ApiResponse<Cabana>>(`${this.apiUrl}/${id}`, cabana);
  }

  /**
   * Cambiar estado de cabaña
   */
  cambiarEstado(id: number, nuevoEstado: string): Observable<ApiResponse<Cabana>> {
    return this.http.patch<ApiResponse<Cabana>>(`${this.apiUrl}/${id}/estado`, { estado: nuevoEstado });
  }

  /**
   * Eliminar cabaña (soft delete)
   */
  eliminarCabana(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/${id}`);
  }

}
