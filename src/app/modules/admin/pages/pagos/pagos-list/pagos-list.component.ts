import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PagoResponse, PagoService } from '../../../../../core/services/pago.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pagos-list',
  templateUrl: './pagos-list.component.html',
  styleUrls: ['./pagos-list.component.scss']
})
export class PagosListComponent implements OnInit, AfterViewInit {

  // MatTable configuration
  displayedColumns: string[] = ['id', 'fecha', 'tipo', 'recurso', 'monto', 'metodo', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<PagoResponse>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  loading = false;

  // Filtros
  filtroEstado: string = '';
  filtroMetodoPago: string = '';
  filtroBusqueda: string = '';
  filtroTipo: string = '';

  // Estadísticas
  stats = {
    total: 0,
    completados: 0,
    pendientes: 0,
    fallidos: 0,
    reembolsados: 0,
    montoTotal: 0
  };

  // Estados y métodos de pago disponibles
  estados = [
    { value: 'COMPLETADO', label: 'Completado' },
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'FALLIDO', label: 'Fallido' },
    { value: 'REEMBOLSADO', label: 'Reembolsado' }
  ];

  metodosPago = [
    { value: 'EFECTIVO', label: 'Efectivo' },
    { value: 'TARJETA', label: 'Tarjeta' },
    { value: 'TRANSFERENCIA', label: 'Transferencia' },
    { value: 'WEBPAY', label: 'Webpay' }
  ];

  tipos = [
    { value: 'CABANA', label: 'Cabaña' },
    { value: 'SERVICIO', label: 'Servicio' },
    { value: 'PAQUETE', label: 'Paquete' }
  ];

  constructor(public pagoService: PagoService) {}

  ngOnInit(): void {
    this.cargarPagos();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Configurar ordenamiento personalizado para fechas
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'fecha':
          return new Date(item.fechaPago).getTime();
        default:
          return (item as any)[property];
      }
    };

    // Configurar filtro personalizado
    this.dataSource.filterPredicate = (data: PagoResponse, filter: string) => {
      const searchStr = filter.toLowerCase();
      const matchesSearch =
        data.id.toString().includes(searchStr) ||
        (data.nombreRecurso?.toLowerCase().includes(searchStr) || false) ||
        (data.transaccionId?.toLowerCase().includes(searchStr) || false);

      const matchesEstado = !this.filtroEstado || data.estado === this.filtroEstado;
      const matchesMetodo = !this.filtroMetodoPago || data.metodoPago === this.filtroMetodoPago;
      const matchesTipo = !this.filtroTipo || (data.tipoReserva === this.filtroTipo);

      return matchesSearch && matchesEstado && matchesMetodo && matchesTipo;
    };
  }

  cargarPagos(): void {
    this.loading = true;
    this.pagoService.obtenerTodos().subscribe({
      next: (pagos) => {
        // Ordenar por fecha descendente
        const pagosOrdenados = pagos.sort((a, b) =>
          new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime()
        );
        this.dataSource.data = pagosOrdenados;
        this.calcularEstadisticas(pagosOrdenados);
        this.loading = false;

        // Aplicar paginator y sort después de cargar datos
        setTimeout(() => {
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
          if (this.sort) {
            this.dataSource.sort = this.sort;
          }
        }, 0);
      },
      error: (error) => {
        console.error('Error al cargar pagos:', error);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los pagos',
          confirmButtonColor: '#3f51b5'
        });
      }
    });
  }

  calcularEstadisticas(pagos: PagoResponse[]): void {
    this.stats = {
      total: pagos.length,
      completados: pagos.filter(p => p.estado === 'COMPLETADO').length,
      pendientes: pagos.filter(p => p.estado === 'PENDIENTE').length,
      fallidos: pagos.filter(p => p.estado === 'FALLIDO').length,
      reembolsados: pagos.filter(p => p.estado === 'REEMBOLSADO').length,
      montoTotal: pagos
        .filter(p => p.estado === 'COMPLETADO')
        .reduce((total, pago) => total + pago.monto, 0)
    };
  }

  aplicarFiltros(): void {
    const filterValue = this.filtroBusqueda.trim().toLowerCase();
    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  limpiarFiltros(): void {
    this.filtroEstado = '';
    this.filtroMetodoPago = '';
    this.filtroBusqueda = '';
    this.filtroTipo = '';
    this.dataSource.filter = '';

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  verDetalle(pago: PagoResponse): void {
    const htmlContent = `
      <div style="text-align: left;">
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <th style="padding: 8px; text-align: left; color: #64748b;">ID Pago:</th>
              <td style="padding: 8px;">#${pago.id}</td>
            </tr>
            ${pago.reservaId ? `<tr style="border-bottom: 1px solid #e0e0e0;"><th style="padding: 8px; text-align: left; color: #64748b;">ID Reserva:</th><td style="padding: 8px;">#${pago.reservaId}</td></tr>` : ''}
            ${pago.paqueteId ? `<tr style="border-bottom: 1px solid #e0e0e0;"><th style="padding: 8px; text-align: left; color: #64748b;">ID Paquete:</th><td style="padding: 8px;">#${pago.paqueteId}</td></tr>` : ''}
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <th style="padding: 8px; text-align: left; color: #64748b;">Recurso:</th>
              <td style="padding: 8px;">${pago.nombreRecurso || 'N/A'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <th style="padding: 8px; text-align: left; color: #64748b;">Tipo:</th>
              <td style="padding: 8px;">${this.getTipoLabel(pago.tipoReserva) || 'N/A'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <th style="padding: 8px; text-align: left; color: #64748b;">Monto:</th>
              <td style="padding: 8px; font-weight: bold; color: #43a047;">${this.formatearMonto(pago.monto)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <th style="padding: 8px; text-align: left; color: #64748b;">Método de Pago:</th>
              <td style="padding: 8px;">${this.getMetodoPagoLabel(pago.metodoPago)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <th style="padding: 8px; text-align: left; color: #64748b;">Estado:</th>
              <td style="padding: 8px;">${this.getEstadoLabel(pago.estado)}</td>
            </tr>
            ${pago.transaccionId ? `<tr style="border-bottom: 1px solid #e0e0e0;"><th style="padding: 8px; text-align: left; color: #64748b;">ID Transacción:</th><td style="padding: 8px;"><code>${pago.transaccionId}</code></td></tr>` : ''}
            <tr>
              <th style="padding: 8px; text-align: left; color: #64748b;">Fecha Pago:</th>
              <td style="padding: 8px;">${this.formatearFecha(pago.fechaPago)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    Swal.fire({
      title: 'Detalle del Pago',
      html: htmlContent,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#3f51b5',
      width: '600px'
    });
  }

  getEstadoChipClass(estado: string): string {
    switch (estado) {
      case 'COMPLETADO':
        return 'chip-completado';
      case 'PENDIENTE':
        return 'chip-pendiente';
      case 'FALLIDO':
        return 'chip-fallido';
      case 'REEMBOLSADO':
        return 'chip-reembolsado';
      default:
        return '';
    }
  }

  getMetodoChipClass(metodo: string): string {
    const metodoMap: { [key: string]: string } = {
      'EFECTIVO': 'chip-efectivo',
      'TARJETA': 'chip-tarjeta',
      'TRANSFERENCIA': 'chip-transferencia',
      'WEBPAY': 'chip-webpay'
    };
    return metodoMap[metodo] || '';
  }

  getTipoChipClass(tipo: string): string {
    const tipoMap: { [key: string]: string } = {
      'CABANA': 'chip-cabana',
      'SERVICIO': 'chip-servicio',
      'PAQUETE': 'chip-paquete'
    };
    return tipoMap[tipo] || '';
  }

  getEstadoLabel(estado: string): string {
    const labels: { [key: string]: string } = {
      'COMPLETADO': 'Completado',
      'PENDIENTE': 'Pendiente',
      'FALLIDO': 'Fallido',
      'REEMBOLSADO': 'Reembolsado'
    };
    return labels[estado] || estado;
  }

  getMetodoPagoLabel(metodo: string): string {
    const labels: { [key: string]: string } = {
      'EFECTIVO': 'Efectivo',
      'TARJETA': 'Tarjeta',
      'TRANSFERENCIA': 'Transferencia',
      'WEBPAY': 'Webpay'
    };
    return labels[metodo] || metodo;
  }

  getTipoLabel(tipo: string | undefined): string {
    if (!tipo) return 'N/A';
    const labels: { [key: string]: string } = {
      'CABANA': 'Cabaña',
      'SERVICIO': 'Servicio',
      'PAQUETE': 'Paquete'
    };
    return labels[tipo] || tipo;
  }

  getMetodoPagoIcon(metodo: string): string {
    const icons: { [key: string]: string } = {
      'EFECTIVO': 'payments',
      'TARJETA': 'credit_card',
      'TRANSFERENCIA': 'account_balance',
      'WEBPAY': 'shopping_cart'
    };
    return icons[metodo] || 'payment';
  }

  formatearMonto(monto: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(monto);
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearFechaCorta(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  exportarCSV(): void {
    const data = this.dataSource.filteredData;

    if (data.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin datos',
        text: 'No hay pagos para exportar',
        confirmButtonColor: '#3f51b5'
      });
      return;
    }

    const csv = this.convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `pagos_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'Exportado',
      text: `${data.length} pagos exportados exitosamente`,
      timer: 2000,
      showConfirmButton: false
    });
  }

  private convertToCSV(data: PagoResponse[]): string {
    const headers = ['ID', 'Tipo', 'Recurso', 'Monto', 'Método de Pago', 'Estado', 'Fecha'];
    const rows = data.map(pago => [
      pago.id,
      this.getTipoLabel(pago.tipoReserva),
      pago.nombreRecurso || 'N/A',
      pago.monto,
      this.getMetodoPagoLabel(pago.metodoPago),
      this.getEstadoLabel(pago.estado),
      this.formatearFecha(pago.fechaPago)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }
}
