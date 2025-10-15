import { Component, OnInit } from '@angular/core';
import { PagoResponse, PagoService } from '../../../../../core/services/pago.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pagos-list',
  templateUrl: './pagos-list.component.html',
  styleUrls: ['./pagos-list.component.scss']
})
export class PagosListComponent implements OnInit {
  pagos: PagoResponse[] = [];
  pagosFiltrados: PagoResponse[] = [];
  cargando = false;

  // Filtros
  filtroEstado = '';
  filtroMetodoPago = '';
  filtroBusqueda = '';
  filtroTipo = '';

  // Estados y métodos de pago disponibles
  estados = ['COMPLETADO', 'PENDIENTE', 'FALLIDO', 'REEMBOLSADO'];
  metodosPago = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'WEBPAY'];
  tipos = ['CABANA', 'SERVICIO', 'PAQUETE'];

  // Paginación
  paginaActual = 1;
  itemsPorPagina = 10;

  constructor(private pagoService: PagoService) {}

  ngOnInit(): void {
    this.cargarPagos();
  }

  cargarPagos(): void {
    this.cargando = true;
    this.pagoService.obtenerTodos().subscribe({
      next: (pagos) => {
        this.pagos = pagos.sort((a, b) =>
          new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime()
        );
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar pagos:', error);
        Swal.fire('Error', 'No se pudieron cargar los pagos', 'error');
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.pagosFiltrados = this.pagos.filter(pago => {
      const cumpleEstado = !this.filtroEstado || pago.estado === this.filtroEstado;
      const cumpleMetodo = !this.filtroMetodoPago || pago.metodoPago === this.filtroMetodoPago;
      const cumpleTipo = !this.filtroTipo || pago.tipoReserva === this.filtroTipo;
      const cumpleBusqueda = !this.filtroBusqueda ||
        pago.nombreRecurso?.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
        pago.transaccionId?.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
        pago.id.toString().includes(this.filtroBusqueda);

      return cumpleEstado && cumpleMetodo && cumpleTipo && cumpleBusqueda;
    });

    this.paginaActual = 1; // Reset a la primera página al filtrar
  }

  limpiarFiltros(): void {
    this.filtroEstado = '';
    this.filtroMetodoPago = '';
    this.filtroBusqueda = '';
    this.filtroTipo = '';
    this.aplicarFiltros();
  }

  get pagosPaginados(): PagoResponse[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.pagosFiltrados.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.pagosFiltrados.length / this.itemsPorPagina);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  verDetalle(pago: PagoResponse): void {
    const htmlContent = `
      <div class="text-start">
        <table class="table table-sm">
          <tbody>
            <tr>
              <th>ID Pago:</th>
              <td>#${pago.id}</td>
            </tr>
            ${pago.reservaId ? `<tr><th>ID Reserva:</th><td>#${pago.reservaId}</td></tr>` : ''}
            ${pago.paqueteId ? `<tr><th>ID Paquete:</th><td>#${pago.paqueteId}</td></tr>` : ''}
            <tr>
              <th>Recurso:</th>
              <td>${pago.nombreRecurso || 'N/A'}</td>
            </tr>
            <tr>
              <th>Tipo:</th>
              <td>${pago.tipoReserva || 'N/A'}</td>
            </tr>
            <tr>
              <th>Monto:</th>
              <td class="fw-bold text-success">$${this.formatearMonto(pago.monto)}</td>
            </tr>
            <tr>
              <th>Método de Pago:</th>
              <td><i class="${this.pagoService.getIconoMetodoPago(pago.metodoPago)}"></i> ${pago.metodoPago}</td>
            </tr>
            <tr>
              <th>Estado:</th>
              <td><span class="badge ${this.getBadgeClase(pago.estado)}">${pago.estado}</span></td>
            </tr>
            ${pago.transaccionId ? `<tr><th>ID Transacción:</th><td><code>${pago.transaccionId}</code></td></tr>` : ''}
            <tr>
              <th>Fecha Pago:</th>
              <td>${this.formatearFecha(pago.fechaPago)}</td>
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
      width: '600px'
    });
  }

  formatearMonto(monto: number): string {
    return new Intl.NumberFormat('es-CL').format(monto);
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

  getBadgeClase(estado: string): string {
    switch (estado) {
      case 'COMPLETADO':
        return 'bg-success';
      case 'PENDIENTE':
        return 'bg-warning';
      case 'FALLIDO':
        return 'bg-danger';
      case 'REEMBOLSADO':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  }

  calcularTotalMonto(): number {
    return this.pagosFiltrados
      .filter(p => p.estado === 'COMPLETADO')
      .reduce((total, pago) => total + pago.monto, 0);
  }

  exportarCSV(): void {
    const csvHeader = 'ID,Tipo,Recurso,Monto,Método de Pago,Estado,Fecha\n';
    const csvData = this.pagosFiltrados.map(pago =>
      `${pago.id},${pago.tipoReserva || 'N/A'},${pago.nombreRecurso || 'N/A'},${pago.monto},${pago.metodoPago},${pago.estado},${pago.fechaPago}`
    ).join('\n');

    const blob = new Blob([csvHeader + csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pagos_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire('Éxito', 'Archivo CSV generado correctamente', 'success');
  }
}
