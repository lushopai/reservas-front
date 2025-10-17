import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ReservaService } from '../../../../core/services/reserva.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PagoService, PagoRequest } from '../../../../core/services/pago.service';
import { Reserva, EstadoReserva } from '../../../../core/models/reserva.model';

@Component({
  selector: 'app-mis-reservas',
  templateUrl: './mis-reservas.component.html',
  styleUrls: ['./mis-reservas.component.scss']
})
export class MisReservasComponent implements OnInit, AfterViewInit {
  // Material Table
  displayedColumns: string[] = ['id', 'recurso', 'fechas', 'estado', 'precio', 'acciones'];
  dataSource: MatTableDataSource<Reserva>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Controles de búsqueda y filtros
  searchControl = new FormControl('');
  estadosFiltro: Set<string> = new Set();

  // Estados disponibles
  estadosReserva = [
    { valor: EstadoReserva.PENDIENTE, label: 'Pendiente', color: 'warn', icon: 'schedule' },
    { valor: EstadoReserva.CONFIRMADA, label: 'Confirmada', color: 'primary', icon: 'check_circle' },
    { valor: EstadoReserva.EN_CURSO, label: 'En Curso', color: 'accent', icon: 'play_circle' },
    { valor: EstadoReserva.COMPLETADA, label: 'Completada', color: '', icon: 'done_all' },
    { valor: EstadoReserva.CANCELADA, label: 'Cancelada', color: '', icon: 'cancel' }
  ];

  cargando = false;
  totalReservas = 0;

  constructor(
    private reservaService: ReservaService,
    private authService: AuthService,
    private pagoService: PagoService,
    private router: Router
  ) {
    this.dataSource = new MatTableDataSource<Reserva>([]);
  }

  ngOnInit(): void {
    this.cargarReservas();
    this.configurarBusqueda();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Configurar filtro personalizado
    this.dataSource.filterPredicate = this.crearFiltroPredicate();
  }

  configurarBusqueda(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.aplicarFiltros();
      });
  }

  cargarReservas(): void {
    const user = this.authService.getCurrentUser();
    if (!user || !user.id) {
      Swal.fire('Error', 'Debe iniciar sesión para ver sus reservas', 'error');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.cargando = true;
    this.reservaService.obtenerReservasUsuario(user.id).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.totalReservas = data.length;
        this.cargando = false;
        console.log('Reservas cargadas:', data.length);
      },
      error: (error) => {
        console.error('Error al cargar reservas:', error);
        Swal.fire('Error', 'No se pudieron cargar las reservas', 'error');
        this.cargando = false;
      }
    });
  }

  // Filtros
  toggleEstadoFiltro(estado: string): void {
    if (this.estadosFiltro.has(estado)) {
      this.estadosFiltro.delete(estado);
    } else {
      this.estadosFiltro.add(estado);
    }
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.searchControl.setValue('');
    this.estadosFiltro.clear();
    this.dataSource.filter = '';
  }

  aplicarFiltros(): void {
    const filtro = {
      busqueda: this.searchControl.value?.toLowerCase() || '',
      estados: Array.from(this.estadosFiltro)
    };
    this.dataSource.filter = JSON.stringify(filtro);
  }

  crearFiltroPredicate(): (data: Reserva, filter: string) => boolean {
    return (data: Reserva, filter: string): boolean => {
      if (!filter) return true;

      const filtro = JSON.parse(filter);

      // Filtro por búsqueda
      if (filtro.busqueda) {
        const cumpleBusqueda =
          data.nombreRecurso?.toLowerCase().includes(filtro.busqueda) ||
          data.id?.toString().includes(filtro.busqueda) ||
          data.estado?.toLowerCase().includes(filtro.busqueda);

        if (!cumpleBusqueda) return false;
      }

      // Filtro por estados
      if (filtro.estados.length > 0) {
        if (!filtro.estados.includes(data.estado)) {
          return false;
        }
      }

      return true;
    };
  }

  // Acciones
  verDetalle(reserva: Reserva): void {
    Swal.fire({
      title: `Reserva #${reserva.id}`,
      html: `
        <div class="text-start">
          <p><strong>Recurso:</strong> ${reserva.nombreRecurso}</p>
          <p><strong>Tipo:</strong> ${this.formatearTipo(reserva.tipoReserva)}</p>
          <p><strong>Inicio:</strong> ${this.formatearFecha(reserva.fechaInicio)}</p>
          <p><strong>Fin:</strong> ${this.formatearFecha(reserva.fechaFin)}</p>
          <p><strong>Total:</strong> ${this.formatearPrecio(reserva.precioTotal)}</p>
          <p><strong>Estado:</strong> <span class="badge ${this.getBadgeClass(reserva.estado)}">${reserva.estado}</span></p>
          ${reserva.observaciones ? `<p><strong>Observaciones:</strong> ${reserva.observaciones}</p>` : ''}
        </div>
      `,
      confirmButtonText: 'Cerrar',
      width: '600px'
    });
  }

  cancelarReserva(reserva: Reserva): void {
    if (reserva.estado !== EstadoReserva.PENDIENTE && reserva.estado !== EstadoReserva.CONFIRMADA) {
      Swal.fire('No permitido', 'Solo se pueden cancelar reservas pendientes o confirmadas', 'warning');
      return;
    }

    Swal.fire({
      title: '¿Cancelar reserva?',
      text: `¿Está seguro de cancelar la reserva #${reserva.id}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
      input: 'textarea',
      inputLabel: 'Motivo de cancelación (opcional)',
      inputPlaceholder: 'Escriba el motivo...'
    }).then((result) => {
      if (result.isConfirmed && reserva.id) {
        this.reservaService.cancelarReserva(reserva.id, result.value).subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire('Cancelada', response.message, 'success');
              this.cargarReservas();
            }
          },
          error: (error) => {
            console.error('Error al cancelar:', error);
            Swal.fire('Error', 'No se pudo cancelar la reserva', 'error');
          }
        });
      }
    });
  }

  pagarReserva(reserva: Reserva): void {
    if (reserva.estado !== EstadoReserva.PENDIENTE) {
      Swal.fire('No disponible', 'Solo se pueden pagar reservas pendientes', 'warning');
      return;
    }

    Swal.fire({
      title: 'Procesar Pago',
      html: `
        <div class="text-start">
          <p class="mb-3"><strong>Reserva:</strong> ${reserva.nombreRecurso}</p>
          <p class="mb-3"><strong>Monto a pagar:</strong> <span class="text-success fw-bold">${this.formatearPrecio(reserva.precioTotal)}</span></p>

          <label class="form-label"><strong>Método de pago:</strong></label>
          <select id="metodoPago" class="form-select mb-3">
            <option value="TARJETA">Tarjeta de Crédito/Débito</option>
            <option value="TRANSFERENCIA">Transferencia Bancaria</option>
            <option value="EFECTIVO">Efectivo</option>
            <option value="WEBPAY">WebPay</option>
          </select>

          <label class="form-label"><strong>Número de transacción (opcional):</strong></label>
          <input id="transaccionId" type="text" class="form-control" placeholder="Ej: TRX123456">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Procesar Pago',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      preConfirm: () => {
        const metodoPago = (document.getElementById('metodoPago') as HTMLSelectElement).value;
        const transaccionId = (document.getElementById('transaccionId') as HTMLInputElement).value;
        return { metodoPago: metodoPago as any, transaccionId: transaccionId || undefined };
      }
    }).then((result) => {
      if (result.isConfirmed && reserva.id) {
        const pagoRequest: PagoRequest = {
          monto: reserva.precioTotal,
          metodoPago: result.value.metodoPago,
          transaccionId: result.value.transaccionId
        };

        Swal.fire({
          title: 'Procesando pago...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        this.pagoService.procesarPagoReserva(reserva.id, pagoRequest).subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire({
                icon: 'success',
                title: 'Pago Exitoso',
                html: `<p>Su pago ha sido procesado. ID: #${response.data.id}</p>`,
                confirmButtonText: 'Aceptar'
              }).then(() => this.cargarReservas());
            }
          },
          error: (error) => {
            Swal.fire('Error', error.error?.message || 'No se pudo procesar el pago', 'error');
          }
        });
      }
    });
  }

  // Utilidades
  getEstadoConfig(estado: string) {
    return this.estadosReserva.find(e => e.valor === estado) || this.estadosReserva[0];
  }

  getBadgeClass(estado: string): string {
    switch (estado) {
      case EstadoReserva.PENDIENTE: return 'bg-warning';
      case EstadoReserva.CONFIRMADA: return 'bg-success';
      case EstadoReserva.CANCELADA: return 'bg-danger';
      case EstadoReserva.COMPLETADA: return 'bg-info';
      default: return 'bg-secondary';
    }
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(precio);
  }

  formatearTipo(tipo: string): string {
    return tipo === 'CABANA_DIA' ? 'Cabaña' : 'Servicio';
  }

  nuevaReserva(): void {
    this.router.navigate(['/cabanas']);
  }
}
