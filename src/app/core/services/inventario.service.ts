import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/environment';
import { ItemInventario, ItemInventarioRequest } from '../models/inventario.model';

export interface SuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private apiUrl = `${environment.apiUrl}/api/inventario`;

  constructor(private http: HttpClient) {}

  obtenerTodos(): Observable<ItemInventario[]> {
    return this.http.get<ItemInventario[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<ItemInventario> {
    return this.http.get<ItemInventario>(`${this.apiUrl}/${id}`);
  }

  obtenerPorRecurso(recursoId: number): Observable<ItemInventario[]> {
    return this.http.get<ItemInventario[]>(`${this.apiUrl}/recurso/${recursoId}`);
  }

  verificarDisponibilidad(itemId: number, cantidad: number, fechaInicio: string, fechaFin: string): Observable<SuccessResponse<boolean>> {
    let params = new HttpParams()
      .set('cantidad', cantidad.toString())
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get<SuccessResponse<boolean>>(`${this.apiUrl}/${itemId}/disponibilidad`, { params });
  }

  crear(request: ItemInventarioRequest): Observable<SuccessResponse<ItemInventario>> {
    return this.http.post<SuccessResponse<ItemInventario>>(this.apiUrl, request);
  }

  actualizar(id: number, request: ItemInventarioRequest): Observable<SuccessResponse<ItemInventario>> {
    return this.http.put<SuccessResponse<ItemInventario>>(`${this.apiUrl}/${id}`, request);
  }

  eliminar(id: number): Observable<SuccessResponse<string>> {
    return this.http.delete<SuccessResponse<string>>(`${this.apiUrl}/${id}`);
  }
}
