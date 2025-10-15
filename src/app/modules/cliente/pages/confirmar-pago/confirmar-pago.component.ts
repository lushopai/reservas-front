import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { ReservaService } from '../../../../core/services/reserva.service';
import { PagoService } from '../../../../core/services/pago.service';
import { Reserva } from '../../../../core/models/reserva.model';

@Component({
  selector: 'app-confirmar-pago',
  templateUrl: './confirmar-pago.component.html',
  styleUrls: ['./confirmar-pago.component.scss']
})
export class ConfirmarPagoComponent implements OnInit {
  reserva: Reserva | null = null;
  formPago!: FormGroup;
  cargando = false;
  procesandoPago = false;

  metodosPago = [
    { valor: 'TARJETA_CREDITO', nombre: 'Tarjeta de Crédito', icono: 'fa-credit-card' },
    { valor: 'TARJETA_DEBITO', nombre: 'Tarjeta de Débito', icono: 'fa-credit-card' },
    { valor: 'TRANSFERENCIA', nombre: 'Transferencia Bancaria', icono: 'fa-exchange-alt' },
    { valor: 'EFECTIVO', nombre: 'Efectivo', icono: 'fa-money-bill-wave' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private reservaService: ReservaService,
    private pagoService: PagoService
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarReserva();
  }

  inicializarFormulario(): void {
    this.formPago = this.fb.group({
      metodoPago: ['TARJETA_CREDITO', Validators.required],
      numeroTarjeta: [''],
      nombreTitular: [''],
      fechaExpiracion: [''],
      cvv: [''],
      numeroTransferencia: [''],
      bancoEmisor: ['']
    });

    // Escuchar cambios en método de pago para validaciones dinámicas
    this.formPago.get('metodoPago')?.valueChanges.subscribe((metodo) => {
      this.actualizarValidaciones(metodo);
    });
  }

  actualizarValidaciones(metodo: string): void {
    const numeroTarjeta = this.formPago.get('numeroTarjeta');
    const nombreTitular = this.formPago.get('nombreTitular');
    const fechaExpiracion = this.formPago.get('fechaExpiracion');
    const cvv = this.formPago.get('cvv');
    const numeroTransferencia = this.formPago.get('numeroTransferencia');
    const bancoEmisor = this.formPago.get('bancoEmisor');

    // Limpiar todas las validaciones
    numeroTarjeta?.clearValidators();
    nombreTitular?.clearValidators();
    fechaExpiracion?.clearValidators();
    cvv?.clearValidators();
    numeroTransferencia?.clearValidators();
    bancoEmisor?.clearValidators();

    // Agregar validaciones según método
    if (metodo === 'TARJETA_CREDITO' || metodo === 'TARJETA_DEBITO') {
      numeroTarjeta?.setValidators([Validators.required, Validators.minLength(13), Validators.maxLength(19)]);
      nombreTitular?.setValidators([Validators.required]);
      fechaExpiracion?.setValidators([Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]);
      cvv?.setValidators([Validators.required, Validators.minLength(3), Validators.maxLength(4)]);
    } else if (metodo === 'TRANSFERENCIA') {
      numeroTransferencia?.setValidators([Validators.required]);
      bancoEmisor?.setValidators([Validators.required]);
    }

    // Actualizar validez
    numeroTarjeta?.updateValueAndValidity();
    nombreTitular?.updateValueAndValidity();
    fechaExpiracion?.updateValueAndValidity();
    cvv?.updateValueAndValidity();
    numeroTransferencia?.updateValueAndValidity();
    bancoEmisor?.updateValueAndValidity();
  }

  cargarReserva(): void {
    const reservaId = Number(this.route.snapshot.paramMap.get('id'));

    if (!reservaId) {
      Swal.fire('Error', 'ID de reserva inválido', 'error');
      this.router.navigate(['/cliente/mis-reservas']);
      return;
    }

    this.cargando = true;
    this.reservaService.obtenerPorId(reservaId).subscribe({
      next: (reserva) => {
        this.reserva = reserva;

        if (reserva.estado !== 'PENDIENTE') {
          Swal.fire({
            title: 'Reserva no disponible',
            text: 'Esta reserva ya fue procesada o cancelada',
            icon: 'warning'
          }).then(() => {
            this.router.navigate(['/cliente/mis-reservas']);
          });
        }

        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar reserva:', error);
        Swal.fire('Error', 'No se pudo cargar la reserva', 'error');
        this.router.navigate(['/cliente/mis-reservas']);
      }
    });
  }

  get mostrarCamposTarjeta(): boolean {
    const metodo = this.formPago.get('metodoPago')?.value;
    return metodo === 'TARJETA_CREDITO' || metodo === 'TARJETA_DEBITO';
  }

  get mostrarCamposTransferencia(): boolean {
    return this.formPago.get('metodoPago')?.value === 'TRANSFERENCIA';
  }

  formatearNumeroTarjeta(event: any): void {
    let valor = event.target.value.replace(/\s/g, '');
    if (valor.length > 0) {
      valor = valor.match(/.{1,4}/g)?.join(' ') || valor;
    }
    event.target.value = valor;
    this.formPago.patchValue({ numeroTarjeta: valor.replace(/\s/g, '') }, { emitEvent: false });
  }

  formatearFechaExpiracion(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length >= 2) {
      valor = valor.substring(0, 2) + '/' + valor.substring(2, 4);
    }
    event.target.value = valor;
    this.formPago.patchValue({ fechaExpiracion: valor }, { emitEvent: false });
  }

  confirmarPago(): void {
    if (this.formPago.invalid) {
      this.formPago.markAllAsTouched();
      Swal.fire('Error', 'Por favor complete todos los campos requeridos', 'error');
      return;
    }

    if (!this.reserva) {
      Swal.fire('Error', 'No hay reserva para procesar', 'error');
      return;
    }

    // Validar tarjeta si corresponde
    if (this.mostrarCamposTarjeta) {
      const numeroTarjeta = this.formPago.get('numeroTarjeta')?.value;
      if (!this.pagoService.validarNumeroTarjeta(numeroTarjeta)) {
        Swal.fire('Error', 'Número de tarjeta inválido', 'error');
        return;
      }
    }

    const metodoPago = this.formPago.get('metodoPago')?.value;

    Swal.fire({
      title: '¿Confirmar pago?',
      html: `
        <p>Método: <strong>${this.getNombreMetodo(metodoPago)}</strong></p>
        <p>Monto: <strong>${this.formatearPrecio(this.reserva.precioTotal)}</strong></p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, pagar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745'
    }).then((result) => {
      if (result.isConfirmed) {
        this.procesarPago();
      }
    });
  }

  procesarPago(): void {
    if (!this.reserva) return;

    this.procesandoPago = true;

    const pagoRequest = {
      monto: this.reserva.precioTotal,
      metodoPago: this.formPago.get('metodoPago')?.value,
      datosPagoAdicionales: this.construirDatosAdicionales()
    };

    this.pagoService.procesarPagoReserva(this.reserva.id!, pagoRequest).subscribe({
      next: (response: any) => {
        if (response.success) {
          Swal.fire({
            title: '¡Pago exitoso!',
            html: `
              <p>Su reserva #${this.reserva?.id} ha sido confirmada.</p>
              <p><strong>Estado:</strong> CONFIRMADA</p>
              <p class="text-success"><i class="fas fa-check-circle"></i> Pago procesado correctamente</p>
            `,
            icon: 'success',
            confirmButtonText: 'Ver Mis Reservas'
          }).then(() => {
            this.router.navigate(['/cliente/mis-reservas']);
          });
        }
      },
      error: (error: any) => {
        console.error('Error al procesar pago:', error);
        const mensaje = error.error?.message || 'No se pudo procesar el pago';
        Swal.fire('Error', mensaje, 'error');
        this.procesandoPago = false;
      }
    });
  }

  construirDatosAdicionales(): any {
    const metodo = this.formPago.get('metodoPago')?.value;
    const datos: any = {};

    if (metodo === 'TARJETA_CREDITO' || metodo === 'TARJETA_DEBITO') {
      datos.numeroTarjeta = this.formPago.get('numeroTarjeta')?.value;
      datos.nombreTitular = this.formPago.get('nombreTitular')?.value;
      datos.fechaExpiracion = this.formPago.get('fechaExpiracion')?.value;
      datos.cvv = this.formPago.get('cvv')?.value;
    } else if (metodo === 'TRANSFERENCIA') {
      datos.numeroTransferencia = this.formPago.get('numeroTransferencia')?.value;
      datos.bancoEmisor = this.formPago.get('bancoEmisor')?.value;
    }

    return datos;
  }

  getNombreMetodo(valor: string): string {
    return this.metodosPago.find(m => m.valor === valor)?.nombre || valor;
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(precio);
  }

  volver(): void {
    this.router.navigate(['/cliente/mis-reservas']);
  }
}
