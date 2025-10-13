import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export interface PagoRequest {
  monto: number;
  metodoPago: 'EFECTIVO' | 'TARJETA_CREDITO' | 'TARJETA_DEBITO' | 'TRANSFERENCIA';
  numeroReferencia?: string;
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
  reservaId: number;
  monto: number;
  metodoPago: string;
  estado: string;
  fechaPago: string;
  numeroReferencia?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private apiUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.reservas}`;

  constructor(private http: HttpClient) {}

  /**
   * Confirmar y pagar una reserva
   */
  confirmarReservaConPago(reservaId: number, pagoRequest: PagoRequest): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${reservaId}/confirmar`, pagoRequest);
  }

  /**
   * Obtener información de pago de una reserva
   */
  obtenerPagoPorReserva(reservaId: number): Observable<PagoResponse> {
    return this.http.get<PagoResponse>(`${this.apiUrl}/${reservaId}/pago`);
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
   * Obtener icono de Font Awesome según método de pago
   */
  getIconoMetodoPago(metodo: string): string {
    switch (metodo) {
      case 'EFECTIVO':
        return 'fa-money-bill-wave';
      case 'TARJETA_CREDITO':
      case 'TARJETA_DEBITO':
        return 'fa-credit-card';
      case 'TRANSFERENCIA':
        return 'fa-exchange-alt';
      default:
        return 'fa-dollar-sign';
    }
  }
}
