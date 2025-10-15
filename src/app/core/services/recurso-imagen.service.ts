import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecursoImagen } from '../models/recurso-imagen.model';

export interface ImagenUploadResponse {
  success: boolean;
  message: string;
  data: RecursoImagen;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class RecursoImagenService {
  private apiUrl = 'http://localhost:8080/api/recursos';

  constructor(private http: HttpClient) {}

  /**
   * Subir imagen para un recurso
   */
  subirImagen(
    recursoId: number,
    file: File,
    descripcion?: string,
    esPrincipal?: boolean
  ): Observable<ImagenUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (descripcion) {
      formData.append('descripcion', descripcion);
    }
    if (esPrincipal !== undefined) {
      formData.append('esPrincipal', esPrincipal.toString());
    }

    return this.http.post<ImagenUploadResponse>(
      `${this.apiUrl}/${recursoId}/imagenes`,
      formData
    );
  }

  /**
   * Obtener todas las imágenes de un recurso
   */
  obtenerImagenes(recursoId: number): Observable<RecursoImagen[]> {
    return this.http.get<RecursoImagen[]>(`${this.apiUrl}/${recursoId}/imagenes`);
  }

  /**
   * Obtener imagen principal de un recurso
   */
  obtenerImagenPrincipal(recursoId: number): Observable<RecursoImagen> {
    return this.http.get<RecursoImagen>(`${this.apiUrl}/${recursoId}/imagenes/principal`);
  }

  /**
   * Eliminar imagen
   */
  eliminarImagen(recursoId: number, imagenId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${recursoId}/imagenes/${imagenId}`);
  }

  /**
   * Establecer imagen como principal
   */
  establecerPrincipal(recursoId: number, imagenId: number): Observable<ImagenUploadResponse> {
    return this.http.patch<ImagenUploadResponse>(
      `${this.apiUrl}/${recursoId}/imagenes/${imagenId}/principal`,
      {}
    );
  }

  /**
   * Actualizar orden de visualización
   */
  actualizarOrden(recursoId: number, imagenId: number, orden: number): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/${recursoId}/imagenes/${imagenId}/orden`,
      null,
      { params: { orden: orden.toString() } }
    );
  }
}
