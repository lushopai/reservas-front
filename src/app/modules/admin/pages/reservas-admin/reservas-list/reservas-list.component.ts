import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { trigger, state, style, transition, animate } from '@angular/animations';
import Swal from 'sweetalert2';
import { ReservaService } from '../../../../../core/services/reserva.service';
import { Reserva, EstadoReserva } from '../../../../../core/models/reserva.model';

// ✅ Interface para agrupar reservas de paquete
interface ReservaDisplay {
  id?: number;
  esPaquete: boolean;
  paqueteId?: number;
  nombrePaquete?: string;
  reservas: Reserva[];
  // Campos calculados del paquete
  nombreUsuario?: string;
  nombreRecurso?: string;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoReserva;
  precioTotal: number;
  tipoReserva?: string;
  expandido?: boolean;
}

@Component({
  selector: 'app-reservas-list',
  templateUrl: './reservas-list.component.html',
  styleUrls: ['./reservas-list.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', overflow: 'hidden' })),
      state('expanded', style({ height: '*', overflow: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class ReservasListComponent implements OnInit, AfterViewInit {

  // ✅ Agregar columna 'expand' al inicio
  displayedColumns: string[] = ['expand', 'id', 'usuario', 'recurso', 'tipo', 'fechas', 'total', 'estado', 'acciones'];

  // ✅ Cambiar tipo a ReservaDisplay
  dataSource = new MatTableDataSource<ReservaDisplay>([]);

  // ✅ Guardar reservas originales
  reservasOriginales: Reserva[] = [];

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

    // ✅ Configurar filtro personalizado para ReservaDisplay
    this.dataSource.filterPredicate = (data: ReservaDisplay, filter: string) => {
      const searchStr = filter.toLowerCase().trim();

      // Evaluar filtro de estado
      const matchesEstado = !this.filtroEstado || data.estado === this.filtroEstado;

      // Si no hay búsqueda de texto, solo aplicar filtro de estado
      if (!searchStr) {
        return matchesEstado;
      }

      // Si es paquete, buscar en todas las reservas del paquete
      if (data.esPaquete) {
        const matchesSearch =
          data.paqueteId?.toString().includes(searchStr) ||
          (data.nombrePaquete?.toLowerCase() || '').includes(searchStr) ||
          (data.nombreUsuario?.toLowerCase() || '').includes(searchStr) ||
          data.reservas.some(r =>
            (r.nombreRecurso?.toLowerCase() || '').includes(searchStr)
          );

        return matchesSearch && matchesEstado;
      }

      // Si es individual, buscar normalmente
      const reserva = data.reservas[0];
      const matchesSearch =
        reserva.id?.toString().includes(searchStr) ||
        (reserva.nombreUsuario?.toLowerCase() || '').includes(searchStr) ||
        (reserva.nombreRecurso?.toLowerCase() || '').includes(searchStr);

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

  // ✅ Modificar cargarReservas para agrupar
  cargarReservas(): void {
    this.cargando = true;
    this.reservaService.obtenerTodas().subscribe({
      next: (data) => {
        this.reservasOriginales = data;

        // ✅ Agrupar reservas antes de asignar
        const reservasAgrupadas = this.agruparReservasPorPaquete(data);
        this.dataSource.data = reservasAgrupadas;

        // ✅ Calcular estadísticas con reservas originales
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

        console.log('Reservas originales:', data.length);
        console.log('Reservas agrupadas:', reservasAgrupadas.length);
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

  // ✅ NUEVO: Método para agrupar reservas por paquete
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
      const estadoFinal = (primera.estadoPaquete || primera.estado) as EstadoReserva;

      // ✅ Usar precio final del paquete (con descuento) si está disponible
      const precioTotal = primera.precioFinalPaquete !== undefined && primera.precioFinalPaquete !== null
        ? primera.precioFinalPaquete
        : reservasPaquete.reduce((sum, r) => sum + r.precioTotal, 0);

      resultado.push({
        id: paqueteId,
        esPaquete: true,
        paqueteId: paqueteId,
        nombrePaquete: primera.nombrePaquete,
        reservas: reservasPaquete,
        nombreUsuario: primera.nombreUsuario,
        nombreRecurso: `Paquete: ${primera.nombrePaquete || 'Sin nombre'}`,
        fechaInicio: primera.fechaInicio,
        fechaFin: primera.fechaFin,
        estado: estadoFinal,
        precioTotal: precioTotal,
        tipoReserva: 'PAQUETE',
        expandido: false
      });
    });

    // Agregar reservas individuales
    individuales.forEach(reserva => {
      resultado.push({
        id: reserva.id,
        esPaquete: false,
        reservas: [reserva],
        nombreUsuario: reserva.nombreUsuario,
        nombreRecurso: reserva.nombreRecurso,
        fechaInicio: reserva.fechaInicio,
        fechaFin: reserva.fechaFin,
        estado: reserva.estado as EstadoReserva,
        precioTotal: reserva.precioTotal,
        tipoReserva: reserva.tipoReserva,
        expandido: false
      });
    });

    return resultado;
  }

  // ✅ NUEVO: Método para expandir/contraer filas
  toggleExpansion(element: ReservaDisplay): void {
    if (element.esPaquete) {
      element.expandido = !element.expandido;
    }
  }

  calcularEstadisticas(reservas: Reserva[]): void {
    this.stats = {
      total: reservas.length,
      pendientes: reservas.filter(r => r.estado === EstadoReserva.PENDIENTE).length,
      confirmadas: reservas.filter(r => r.estado === EstadoReserva.CONFIRMADA || r.estado === 'CONFIRMADO').length,
      completadas: reservas.filter(r => r.estado === EstadoReserva.COMPLETADA).length,
      canceladas: reservas.filter(r => r.estado === EstadoReserva.CANCELADA).length,
      ingresosTotal: reservas
        .filter(r => r.estado !== EstadoReserva.CANCELADA)
        .reduce((sum, r) => sum + (r.precioTotal || 0), 0)
    };
  }

  aplicarFiltros(): void {
    // Aplicar filtro de búsqueda
    const filterValue = this.filtroBusqueda.trim().toLowerCase();

    // Forzar recalculación del filtro usando un truco:
    // Primero asignar un valor dummy, luego el valor real
    this.dataSource.filter = 'FORCE_UPDATE_' + Date.now();

    // En el siguiente ciclo, asignar el valor real
    setTimeout(() => {
      this.dataSource.filter = filterValue;

      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    }, 0);
  }

  limpiarFiltros(): void {
    this.filtroEstado = '';
    this.filtroBusqueda = '';

    // Aplicar los filtros limpios (esto recalculará con los valores vacíos)
    this.aplicarFiltros();
  }

  // ✅ Modificar verDetalle para manejar paquetes
  verDetalle(reservaDisplay: ReservaDisplay): void {
    if (reservaDisplay.esPaquete) {
      // Si es paquete, mostrar primera reserva
      const primeraReserva = reservaDisplay.reservas[0];
      this.router.navigate(['/admin/reservas', primeraReserva.id]);
    } else {
      this.router.navigate(['/admin/reservas', reservaDisplay.id]);
    }
  }

  getEstadoChipClass(estado: string): string {
    switch (estado) {
      case EstadoReserva.PENDIENTE:
        return 'chip-pendiente';
      case EstadoReserva.CONFIRMADA:
      case 'CONFIRMADO':
        return 'chip-confirmada';
      case EstadoReserva.COMPLETADA:
        return 'chip-completada';
      case EstadoReserva.CANCELADA:
        return 'chip-cancelada';
      default:
        return '';
    }
  }

  // ✅ Modificar getTipoReservaLabel para incluir paquetes
  getTipoReservaLabel(tipo: string): string {
    if (tipo === 'PAQUETE') return 'Paquete';
    return tipo === 'CABANA_DIA' ? 'Cabaña' : 'Servicio';
  }

  // ✅ Modificar getTipoChipClass para incluir paquetes
  getTipoChipClass(tipo: string): string {
    if (tipo === 'PAQUETE') return 'chip-paquete';
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

  // ✅ Modificar exportarCSV para incluir info de paquetes
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
      text: `${data.length} registros exportados exitosamente`,
      timer: 2000,
      showConfirmButton: false
    });
  }

  private convertToCSV(data: ReservaDisplay[]): string {
    const headers = ['ID', 'Tipo', 'Usuario', 'Recurso', 'Fecha Inicio', 'Fecha Fin', 'Total', 'Estado'];
    const rows = data.map(item => [
      item.id,
      this.getTipoReservaLabel(item.tipoReserva || ''),
      item.nombreUsuario || 'N/A',
      item.nombreRecurso,
      this.formatearFecha(item.fechaInicio),
      this.formatearFecha(item.fechaFin),
      item.precioTotal,
      item.estado
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }
}
