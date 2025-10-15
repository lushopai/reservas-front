import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { SuccessResponse } from './reserva.service';

export interface PagoRequest {
  monto: number;
  metodoPago: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'WEBPAY';
  transaccionId?: string;
  datosPagoAdicionales?: {
    numeroTarjeta?: string;
    nombreTitular?: string;
    fechaExpiracion?: string;
    cvv?: string;
    bancoEmisor?: string;
    numeroTransferencia?: string;
  };
}

export interface PagoResponse {
  id: number;
  reservaId?: number;
  paqueteId?: number;
  monto: number;
  metodoPago: string;
  estado: string;
  transaccionId?: string;
  fechaPago: string;
  nombreRecurso?: string;
  tipoReserva?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private apiUrl = `${API_CONFIG.baseUrl}/api/pagos`;

  constructor(private http: HttpClient) {}

  /**
   * Procesar pago de una reserva individual
   */
  procesarPagoReserva(reservaId: number, pagoRequest: PagoRequest): Observable<SuccessResponse<PagoResponse>> {
    return this.http.post<SuccessResponse<PagoResponse>>(`${this.apiUrl}/reserva/${reservaId}`, pagoRequest);
  }

  /**
   * Procesar pago de un paquete
   */
  procesarPagoPaquete(paqueteId: number, pagoRequest: PagoRequest): Observable<SuccessResponse<PagoResponse>> {
    return this.http.post<SuccessResponse<PagoResponse>>(`${this.apiUrl}/paquete/${paqueteId}`, pagoRequest);
  }

  /**
   * Obtener todos los pagos (solo ADMIN)
   */
  obtenerTodos(): Observable<PagoResponse[]> {
    return this.http.get<PagoResponse[]>(this.apiUrl);
  }

  /**
   * Obtener pagos de una reserva
   */
  obtenerPagosReserva(reservaId: number): Observable<SuccessResponse<PagoResponse[]>> {
    return this.http.get<SuccessResponse<PagoResponse[]>>(`${this.apiUrl}/reserva/${reservaId}`);
  }

  /**
   * Obtener pagos de un paquete
   */
  obtenerPagosPaquete(paqueteId: number): Observable<SuccessResponse<PagoResponse[]>> {
    return this.http.get<SuccessResponse<PagoResponse[]>>(`${this.apiUrl}/paquete/${paqueteId}`);
  }

  /**
   * Obtener un pago por ID
   */
  obtenerPago(pagoId: number): Observable<SuccessResponse<PagoResponse>> {
    return this.http.get<SuccessResponse<PagoResponse>>(`${this.apiUrl}/${pagoId}`);
  }

  /**
   * Validar número de tarjeta (algoritmo de Luhn simplificado)
   */
  validarNumeroTarjeta(numero: string): boolean {
    // Eliminar espacios y guiones
    numero = numero.replace(/[\s-]/g, '');

    if (!/^\d{13,19}$/.test(numero)) {
      return false;
    }

    // Algoritmo de Luhn
    let suma = 0;
    let alternar = false;

    for (let i = numero.length - 1; i >= 0; i--) {
      let digito = parseInt(numero.charAt(i), 10);

      if (alternar) {
        digito *= 2;
        if (digito > 9) {
          digito -= 9;
        }
      }

      suma += digito;
      alternar = !alternar;
    }

    return (suma % 10) === 0;
  }

  /**
   * Detectar tipo de tarjeta por el número
   */
  detectarTipoTarjeta(numero: string): string {
    numero = numero.replace(/[\s-]/g, '');

    if (/^4/.test(numero)) {
      return 'Visa';
    } else if (/^5[1-5]/.test(numero)) {
      return 'Mastercard';
    } else if (/^3[47]/.test(numero)) {
      return 'American Express';
    } else if (/^6(?:011|5)/.test(numero)) {
      return 'Discover';
    }

    return 'Desconocida';
  }

  /**
   * Formatear número de tarjeta
   */
  formatearNumeroTarjeta(numero: string): string {
    numero = numero.replace(/[\s-]/g, '');
    return numero.replace(/(\d{4})/g, '$1 ').trim();
  }

  /**
   * Obtener icono de Bootstrap Icons según método de pago
   */
  getIconoMetodoPago(metodo: string): string {
    switch (metodo) {
      case 'EFECTIVO':
        return 'bi-cash-coin';
      case 'TARJETA':
        return 'bi-credit-card';
      case 'TRANSFERENCIA':
        return 'bi-bank';
      case 'WEBPAY':
        return 'bi-wallet2';
      default:
        return 'bi-currency-dollar';
    }
  }
}
