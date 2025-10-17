import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import Swal from 'sweetalert2';
import { ReservaService } from '../../../../../core/services/reserva.service';
import { Reserva, EstadoReserva } from '../../../../../core/models/reserva.model';

@Component({
  selector: 'app-reservas-list',
  templateUrl: './reservas-list.component.html',
  styleUrls: ['./reservas-list.component.scss']
})
export class ReservasListComponent implements OnInit, AfterViewInit {

  // MatTable configuration
  displayedColumns: string[] = ['id', 'usuario', 'recurso', 'tipo', 'fechas', 'total', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Reserva>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  cargando = false;
  filtroEstado: string = '';
  filtroBusqueda: string = '';

  // Estadísticas
  stats = {
    total: 0,
    pendientes: 0,
    confirmadas: 0,
    completadas: 0,
    canceladas: 0,
    ingresosTotal: 0
  };

  // Estados disponibles
  estadosReserva = [
    { value: EstadoReserva.PENDIENTE, label: 'Pendiente' },
    { value: EstadoReserva.CONFIRMADA, label: 'Confirmada' },
    { value: EstadoReserva.COMPLETADA, label: 'Completada' },
    { value: EstadoReserva.CANCELADA, label: 'Cancelada' }
  ];

  constructor(
    private reservaService: ReservaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarReservas();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Configurar filtro personalizado
    this.dataSource.filterPredicate = (data: Reserva, filter: string) => {
      const searchStr = filter.toLowerCase();
      const matchesSearch =
        data.id?.toString().includes(searchStr) ||
        (data.nombreUsuario?.toLowerCase() || '').includes(searchStr) ||
        (data.nombreRecurso?.toLowerCase() || '').includes(searchStr);

      const matchesEstado = !this.filtroEstado || data.estado === this.filtroEstado;

      return matchesSearch && matchesEstado;
    };

    // Ordenamiento personalizado para fechas
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'fechas':
          return new Date(item.fechaInicio).getTime();
        default:
          return (item as any)[property];
      }
    };
  }

  cargarReservas(): void {
    this.cargando = true;
    this.reservaService.obtenerTodas().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.calcularEstadisticas(data);
        this.cargando = false;

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
        console.error('Error al cargar reservas:', error);
        this.cargando = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las reservas',
          confirmButtonColor: '#dc3545'
        });
      }
    });
  }

  calcularEstadisticas(reservas: Reserva[]): void {
    this.stats = {
      total: reservas.length,
      pendientes: reservas.filter(r => r.estado === EstadoReserva.PENDIENTE).length,
      confirmadas: reservas.filter(r => r.estado === EstadoReserva.CONFIRMADA).length,
      completadas: reservas.filter(r => r.estado === EstadoReserva.COMPLETADA).length,
      canceladas: reservas.filter(r => r.estado === EstadoReserva.CANCELADA).length,
      ingresosTotal: reservas
        .filter(r => r.estado !== EstadoReserva.CANCELADA)
        .reduce((sum, r) => sum + (r.precioTotal || 0), 0)
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
    this.filtroBusqueda = '';
    this.dataSource.filter = '';

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  verDetalle(reserva: Reserva): void {
    this.router.navigate(['/admin/reservas', reserva.id]);
  }

  getEstadoChipClass(estado: string): string {
    switch (estado) {
      case EstadoReserva.PENDIENTE:
        return 'chip-pendiente';
      case EstadoReserva.CONFIRMADA:
        return 'chip-confirmada';
      case EstadoReserva.COMPLETADA:
        return 'chip-completada';
      case EstadoReserva.CANCELADA:
        return 'chip-cancelada';
      default:
        return '';
    }
  }

  getTipoReservaLabel(tipo: string): string {
    return tipo === 'CABANA_DIA' ? 'Cabaña' : 'Servicio';
  }

  getTipoChipClass(tipo: string): string {
    return tipo === 'CABANA_DIA' ? 'chip-cabana' : 'chip-servicio';
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatearHora(fecha: string): string {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(precio);
  }

  calcularDias(fechaInicio: string, fechaFin: string): number {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  exportarCSV(): void {
    const data = this.dataSource.filteredData;

    if (data.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin datos',
        text: 'No hay reservas para exportar',
        confirmButtonColor: '#3f51b5'
      });
      return;
    }

    const csv = this.convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `reservas_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'Exportado',
      text: `${data.length} reservas exportadas exitosamente`,
      timer: 2000,
      showConfirmButton: false
    });
  }

  private convertToCSV(data: Reserva[]): string {
    const headers = ['ID', 'Usuario', 'Recurso', 'Tipo', 'Fecha Inicio', 'Fecha Fin', 'Total', 'Estado'];
    const rows = data.map(reserva => [
      reserva.id,
      reserva.nombreUsuario || 'N/A',
      reserva.nombreRecurso,
      this.getTipoReservaLabel(reserva.tipoReserva),
      this.formatearFecha(reserva.fechaInicio),
      this.formatearFecha(reserva.fechaFin),
      reserva.precioTotal,
      reserva.estado
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }
}
