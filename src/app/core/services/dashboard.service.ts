import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { SuccessResponse } from './reserva.service';

export interface DashboardStats {
  // Estadísticas de usuarios
  totalUsuarios: number;
  usuariosActivos: number;
  usuariosNuevos: number;

  // Estadísticas de reservas
  totalReservas: number;
  reservasPendientes: number;
  reservasConfirmadas: number;
  reservasCanceladas: number;
  reservasCompletadas: number;
  reservasEnCurso: number;

  // Estadísticas de recursos
  totalCabanas: number;
  cabanasDisponibles: number;
  totalServicios: number;

  // Estadísticas de ingresos
  ingresosMes: number;
  ingresosHoy: number;
  ingresosTotales: number;

  // Datos para gráficos
  reservasPorDia: ReservasPorDia[];
  ingresosPorMes: IngresosPorMes[];

  // Reservas recientes
  reservasRecientes: ReservaResume[];
}

export interface ReservasPorDia {
  fecha: string; // "2025-10-15"
  cantidad: number;
}

export interface IngresosPorMes {
  mes: string; // "2025-10"
  monto: number;
}

export interface ReservaResume {
  id: number;
  nombreUsuario: string;
  emailUsuario: string;
  nombreRecurso: string;
  fechaReserva: string;
  estado: string;
  precioTotal: number;
  // ✅ Campos para agrupamiento de paquetes
  paqueteId?: number;
  nombrePaquete?: string;
  estadoPaquete?: string;
  tipoReserva?: string;
  // ✅ Precios del paquete completo
  precioTotalPaquete?: number;
  descuentoPaquete?: number;
  precioFinalPaquete?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${API_CONFIG.baseUrl}/api/dashboard`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener estadísticas del dashboard
   */
  obtenerEstadisticas(): Observable<SuccessResponse<DashboardStats>> {
    return this.http.get<SuccessResponse<DashboardStats>>(`${this.apiUrl}/stats`);
  }
}
