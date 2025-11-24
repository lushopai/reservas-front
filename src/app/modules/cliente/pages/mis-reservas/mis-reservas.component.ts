import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { trigger, state, style, transition, animate } from '@angular/animations';
import Swal from 'sweetalert2';
import { ReservaService } from '../../../../core/services/reserva.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PagoService, PagoRequest } from '../../../../core/services/pago.service';
import { Reserva, EstadoReserva } from '../../../../core/models/reserva.model';
import { EstadoPaquete } from '../../../../core/models/enums.model';
import { DetalleReservaDialogComponent } from './detalle-reserva-dialog/detalle-reserva-dialog.component';

// Interface para agrupar reservas de paquete
interface ReservaDisplay {
  id?: number;
  esPaquete: boolean;
  paqueteId?: number;
  nombrePaquete?: string;
  reservas: Reserva[];
  // Campos calculados del paquete
  nombreRecurso?: string;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoReserva;
  precioTotal: number;
  tipoReserva?: string;
  expandido?: boolean;
}

@Component({
  selector: 'app-mis-reservas',
  templateUrl: './mis-reservas.component.html',
  styleUrls: ['./mis-reservas.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', display: 'none' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class MisReservasComponent implements OnInit, AfterViewInit {
  // Material Table
  displayedColumns: string[] = ['expand', 'id', 'recurso', 'fechas', 'estado', 'precio', 'acciones'];
  dataSource: MatTableDataSource<ReservaDisplay>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Reservas originales del backend
  reservasOriginales: Reserva[] = [];

  // Controles de búsqueda y filtros
  searchControl = new FormControl('');
  estadosFiltro: Set<string> = new Set();

  // Estados disponibles - Removido alias CONFIRMADO obsoleto
  estadosReserva = [
    { valor: EstadoReserva.PENDIENTE_PAGO, label: 'Pendiente de Pago', color: 'warn', icon: 'payment' },
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
    private router: Router,
    private dialog: MatDialog
  ) {
    this.dataSource = new MatTableDataSource<ReservaDisplay>([]);
  }

  ngOnInit(): void {
    this.cargarReservas();
    this.configurarBusqueda();
  }

  ngAfterViewInit(): void {
    // Configurar filtro personalizado primero
    this.dataSource.filterPredicate = this.crearFiltroPredicate();

    // Conectar paginator y sort
    this.conectarPaginadorYSort();
  }

  private conectarPaginadorYSort(): void {
    if (this.paginator && this.sort) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
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
        this.reservasOriginales = data;
        const reservasAgrupadas = this.agruparReservasPorPaquete(data);
        this.totalReservas = data.length;

        // Asignar datos al dataSource
        this.dataSource.data = reservasAgrupadas;

        this.cargando = false;

        // Forzar actualización del paginador en el próximo ciclo de detección de cambios
        setTimeout(() => {
          this.conectarPaginadorYSort();
          if (this.paginator) {
            this.paginator.length = reservasAgrupadas.length;
            this.paginator._changePageSize(this.paginator.pageSize);
          }
        }, 0);

        // Log para debugging
        console.log('Reservas originales:', data.length);
        console.log('Reservas agrupadas:', reservasAgrupadas.length);
        console.log('Datos en dataSource:', this.dataSource.data.length);
      },
      error: (error) => {
        console.error('Error al cargar reservas:', error);
        Swal.fire('Error', 'No se pudieron cargar las reservas', 'error');
        this.cargando = false;
      }
    });
  }

  private agruparReservasPorPaquete(reservas: Reserva[]): ReservaDisplay[] {
    const paquetes = new Map<number, Reserva[]>();
    const individuales: Reserva[] = [];

    // Separar reservas de paquete de las individuales
    reservas.forEach(reserva => {
      if (reserva.paqueteId) {
        if (!paquetes.has(reserva.paqueteId)) {
          paquetes.set(reserva.paqueteId, []);
        }
        paquetes.get(reserva.paqueteId)!.push(reserva);
      } else {
        individuales.push(reserva);
      }
    });

    const resultado: ReservaDisplay[] = [];

    // Agregar paquetes agrupados
    paquetes.forEach((reservasPaquete, paqueteId) => {
      const primera = reservasPaquete[0];
      // Usar el estado del paquete (estadoPaquete) para mostrar el estado correcto del paquete
      // Si no existe estadoPaquete, usar el estado de la primera reserva
      const estadoFinal = this.mapEstadoPaqueteToEstadoReserva(primera.estadoPaquete) || primera.estado;

      console.log(`Paquete ${paqueteId}:`, {
        estadoPaquete: primera.estadoPaquete,
        estadoReserva: primera.estado,
        estadoFinal: estadoFinal
      });

      // Usar precio final del paquete (con descuento) si está disponible
      const precioTotal = primera.precioFinalPaquete !== undefined && primera.precioFinalPaquete !== null
        ? primera.precioFinalPaquete
        : reservasPaquete.reduce((sum, r) => sum + r.precioTotal, 0);

      resultado.push({
        id: paqueteId, // Usar el paqueteId como ID para la fila
        esPaquete: true,
        paqueteId: paqueteId,
        nombrePaquete: primera.nombrePaquete,
        reservas: reservasPaquete,
        nombreRecurso: `Paquete: ${primera.nombrePaquete || 'Sin nombre'}`,
        fechaInicio: primera.fechaInicio,
        fechaFin: primera.fechaFin,
        estado: estadoFinal, // Usar estado del paquete si existe
        precioTotal: precioTotal,
        tipoReserva: 'PAQUETE', // Agregar tipo
        expandido: false
      });
    });

    // Agregar reservas individuales
    individuales.forEach(reserva => {
      resultado.push({
        id: reserva.id,
        esPaquete: false,
        reservas: [reserva],
        nombreRecurso: reserva.nombreRecurso,
        fechaInicio: reserva.fechaInicio,
        fechaFin: reserva.fechaFin,
        estado: reserva.estado,
        precioTotal: reserva.precioTotal,
        tipoReserva: reserva.tipoReserva
      });
    });

    console.log(`Agrupación: ${paquetes.size} paquetes, ${individuales.length} individuales, ${resultado.length} total`);
    return resultado;
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

  crearFiltroPredicate(): (data: ReservaDisplay, filter: string) => boolean {
    return (data: ReservaDisplay, filter: string): boolean => {
      if (!filter) return true;

      const filtro = JSON.parse(filter);

      // Filtro por búsqueda
      if (filtro.busqueda) {
        // Para paquetes, buscar en todas las reservas del paquete
        if (data.esPaquete) {
          const cumpleBusqueda = data.reservas.some(r =>
            r.nombreRecurso?.toLowerCase().includes(filtro.busqueda) ||
            r.id?.toString().includes(filtro.busqueda) ||
            data.nombrePaquete?.toLowerCase().includes(filtro.busqueda)
          ) || data.estado?.toLowerCase().includes(filtro.busqueda);

          if (!cumpleBusqueda) return false;
        } else {
          // Para reservas individuales
          const reserva = data.reservas[0];
          const cumpleBusqueda =
            reserva.nombreRecurso?.toLowerCase().includes(filtro.busqueda) ||
            reserva.id?.toString().includes(filtro.busqueda) ||
            reserva.estado?.toLowerCase().includes(filtro.busqueda);

          if (!cumpleBusqueda) return false;
        }
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

  // Expansión de paquetes
  toggleExpansion(row: ReservaDisplay): void {
    if (row.esPaquete) {
      row.expandido = !row.expandido;
    }
  }

  // Predicado para mostrar fila de expansión solo en paquetes
  esPaquete = (index: number, row: ReservaDisplay) => row.esPaquete;

  // TrackBy function para optimizar rendering
  trackByReserva = (index: number, item: ReservaDisplay) => {
    return item.esPaquete ? `paquete-${item.paqueteId}` : `reserva-${item.id}`;
  };

  // Acciones
  verDetalle(reservaDisplay: ReservaDisplay): void {
    this.dialog.open(DetalleReservaDialogComponent, {
      data: reservaDisplay,
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      panelClass: 'detalle-reserva-dialog-panel'
    });
  }

  cancelarReserva(reservaDisplay: ReservaDisplay): void {
    // Si es un paquete, cancelar todas las reservas del paquete
    if (reservaDisplay.esPaquete) {
      if (reservaDisplay.estado !== EstadoReserva.PENDIENTE && reservaDisplay.estado !== EstadoReserva.CONFIRMADA) {
        Swal.fire('No permitido', 'Solo se pueden cancelar paquetes pendientes o confirmados', 'warning');
        return;
      }

      Swal.fire({
        title: '¿Cancelar paquete completo?',
        text: `Esto cancelará todas las ${reservaDisplay.reservas.length} reservas del paquete "${reservaDisplay.nombrePaquete}"`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, cancelar todo',
        cancelButtonText: 'No',
        input: 'textarea',
        inputLabel: 'Motivo de cancelación (opcional)',
        inputPlaceholder: 'Escriba el motivo...'
      }).then((result) => {
        if (result.isConfirmed) {
          // Cancelar todas las reservas del paquete
          const cancelaciones = reservaDisplay.reservas.map(r =>
            this.reservaService.cancelarReserva(r.id!, result.value).toPromise()
          );

          Promise.all(cancelaciones).then(() => {
            Swal.fire('Cancelado', 'El paquete completo ha sido cancelado', 'success');
            this.cargarReservas();
          }).catch(error => {
            console.error('Error al cancelar paquete:', error);
            Swal.fire('Error', 'No se pudo cancelar el paquete completo', 'error');
          });
        }
      });
      return;
    }

    // Reserva individual
    const reserva = reservaDisplay.reservas[0];
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

  pagarReserva(reservaDisplay: ReservaDisplay): void {
    // Si es un paquete, pagar todas las reservas del paquete
    if (reservaDisplay.esPaquete) {
      if (reservaDisplay.estado !== EstadoReserva.PENDIENTE && reservaDisplay.estado !== EstadoReserva.BORRADOR) {
        Swal.fire('No disponible', 'Solo se pueden pagar paquetes pendientes o en borrador', 'warning');
        return;
      }

      Swal.fire({
        title: 'Procesar Pago del Paquete',
        html: `
          <div class="text-start">
            <p class="mb-3"><strong>Paquete:</strong> ${reservaDisplay.nombrePaquete}</p>
            <p class="mb-3"><strong>Incluye ${reservaDisplay.reservas.length} reservas</strong></p>
            <p class="mb-3"><strong>Monto total a pagar:</strong> <span class="text-success fw-bold">${this.formatearPrecio(reservaDisplay.precioTotal)}</span></p>

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
        if (result.isConfirmed) {
          const pagoRequest: PagoRequest = {
            monto: reservaDisplay.precioTotal,
            metodoPago: result.value.metodoPago,
            transaccionId: result.value.transaccionId
          };

          Swal.fire({
            title: 'Procesando pago del paquete...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
          });

          // Pagar el paquete completo (no las reservas individuales)
          this.pagoService.procesarPagoPaquete(reservaDisplay.paqueteId!, pagoRequest).subscribe({
            next: (response) => {
              if (response.success) {
                Swal.fire({
                  icon: 'success',
                  title: 'Pago Exitoso',
                  html: `<p>Se ha procesado el pago del paquete completo</p><p><strong>ID de Pago:</strong> #${response.data.id}</p>`,
                  confirmButtonText: 'Aceptar'
                }).then(() => this.cargarReservas());
              }
            },
            error: (error) => {
              console.error('Error al procesar pago:', error);
              Swal.fire('Error', error.error?.message || 'No se pudo procesar el pago del paquete', 'error');
            }
          });
        }
      });
      return;
    }

    // Reserva individual
    const reserva = reservaDisplay.reservas[0];
    if (reserva.estado !== EstadoReserva.PENDIENTE_PAGO && reserva.estado !== EstadoReserva.PENDIENTE) {
      Swal.fire('No disponible', 'Solo se pueden pagar reservas pendientes de pago', 'warning');
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
    // Handle both EstadoReserva and EstadoPaquete values
    switch (estado) {
      case EstadoReserva.PENDIENTE_PAGO:
      case EstadoPaquete.PENDIENTE:
        return 'bg-warning';
      case EstadoReserva.CONFIRMADA:
      case EstadoPaquete.ACTIVO:
        return 'bg-success';
      case EstadoReserva.CANCELADA:
      case EstadoPaquete.CANCELADO:
        return 'bg-danger';
      case EstadoReserva.COMPLETADA:
      case EstadoPaquete.COMPLETADO:
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  }

  /**
   * Maps a EstadoPaquete value to the corresponding EstadoReserva value for UI purposes.
   * Returns undefined if the input is undefined or not a recognized EstadoPaquete.
   */
  mapEstadoPaqueteToEstadoReserva(estadoPaquete?: EstadoPaquete): EstadoReserva | undefined {
    if (!estadoPaquete) return undefined;
    switch (estadoPaquete) {
      case EstadoPaquete.PENDIENTE:
        return EstadoReserva.PENDIENTE;
      case EstadoPaquete.ACTIVO:
        return EstadoReserva.CONFIRMADA;
      case EstadoPaquete.CANCELADO:
        return EstadoReserva.CANCELADA;
      case EstadoPaquete.COMPLETADO:
        return EstadoReserva.COMPLETADA;
      default:
        return undefined;
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
