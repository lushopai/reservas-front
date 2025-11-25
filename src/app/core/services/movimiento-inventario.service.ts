import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/environment';
import {
  MovimientoInventario,
  MovimientoEstadisticas,
  TipoMovimiento
} from '../models/movimiento-inventario.model';

@Injectable({
  providedIn: 'root'
})
export class MovimientoInventarioService {
  private apiUrl = `${environment.apiUrl}/api/movimientos-inventario`;

  constructor(private http: HttpClient) { }

  /**
   * Obtener últimos movimientos
   */
  obtenerMovimientos(): Observable<MovimientoInventario[]> {
    return this.http.get<MovimientoInventario[]>(this.apiUrl);
  }

  /**
   * Obtener movimientos por item
   */
  obtenerPorItem(itemId: number): Observable<MovimientoInventario[]> {
    return this.http.get<MovimientoInventario[]>(`${this.apiUrl}/item/${itemId}`);
  }

  /**
   * Obtener movimientos por tipo
   */
  obtenerPorTipo(tipo: TipoMovimiento): Observable<MovimientoInventario[]> {
    return this.http.get<MovimientoInventario[]>(`${this.apiUrl}/tipo/${tipo}`);
  }

  /**
   * Obtener movimientos por reserva
   */
  obtenerPorReserva(reservaId: number): Observable<MovimientoInventario[]> {
    return this.http.get<MovimientoInventario[]>(`${this.apiUrl}/reserva/${reservaId}`);
  }

  /**
   * Obtener movimientos en un rango de fechas
   */
  obtenerPorRango(inicio: Date, fin: Date): Observable<MovimientoInventario[]> {
    const params = new HttpParams()
      .set('inicio', inicio.toISOString())
      .set('fin', fin.toISOString());

    return this.http.get<MovimientoInventario[]>(`${this.apiUrl}/rango`, { params });
  }

  /**
   * Obtener estadísticas
   */
  obtenerEstadisticas(): Observable<MovimientoEstadisticas> {
    return this.http.get<MovimientoEstadisticas>(`${this.apiUrl}/estadisticas`);
  }
}
