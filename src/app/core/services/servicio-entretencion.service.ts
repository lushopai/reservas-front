import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServicioEntretencion, ServicioRequest, ApiResponse } from '../models/servicio.model';
import { environment } from '../../../../enviroments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServicioEntretencionService {

  private apiUrl = `${environment.apiUrl}/api/servicios`;

  constructor(private http: HttpClient) { }

  /**
   * Crear nuevo servicio
   */
  crearServicio(servicio: ServicioRequest): Observable<ApiResponse<ServicioEntretencion>> {
    return this.http.post<ApiResponse<ServicioEntretencion>>(this.apiUrl, servicio);
  }

  /**
   * Obtener todos los servicios
   */
  obtenerTodos(): Observable<ServicioEntretencion[]> {
    return this.http.get<ServicioEntretencion[]>(this.apiUrl);
  }

  /**
   * Obtener servicios por estado
   */
  obtenerPorEstado(estado: string): Observable<ServicioEntretencion[]> {
    const params = new HttpParams().set('estado', estado);
    return this.http.get<ServicioEntretencion[]>(this.apiUrl, { params });
  }

  /**
   * Obtener servicios por tipo
   */
  obtenerPorTipo(tipo: string): Observable<ServicioEntretencion[]> {
    const params = new HttpParams().set('tipo', tipo);
    return this.http.get<ServicioEntretencion[]>(this.apiUrl, { params });
  }

  /**
   * Obtener servicios disponibles en una fecha
   */
  obtenerDisponibles(fecha: string): Observable<ServicioEntretencion[]> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get<ServicioEntretencion[]>(this.apiUrl, { params });
  }

  /**
   * Obtener servicio por ID
   */
  obtenerPorId(id: number): Observable<ServicioEntretencion> {
    return this.http.get<ServicioEntretencion>(`${this.apiUrl}/${id}`);
  }

  /**
   * Actualizar servicio
   */
  actualizarServicio(id: number, servicio: ServicioRequest): Observable<ApiResponse<ServicioEntretencion>> {
    return this.http.put<ApiResponse<ServicioEntretencion>>(`${this.apiUrl}/${id}`, servicio);
  }

  /**
   * Cambiar estado de servicio
   */
  cambiarEstado(id: number, nuevoEstado: string): Observable<ApiResponse<ServicioEntretencion>> {
    return this.http.patch<ApiResponse<ServicioEntretencion>>(`${this.apiUrl}/${id}/estado`, { estado: nuevoEstado });
  }

  /**
   * Eliminar servicio (soft delete)
   */
  eliminarServicio(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/${id}`);
  }

}
