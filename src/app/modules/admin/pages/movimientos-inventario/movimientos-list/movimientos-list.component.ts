import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MovimientoInventario, TipoMovimiento } from 'src/app/core/models/movimiento-inventario.model';
import { MovimientoInventarioService } from 'src/app/core/services/movimiento-inventario.service';

@Component({
  selector: 'app-movimientos-list',
  templateUrl: './movimientos-list.component.html',
  styleUrls: ['./movimientos-list.component.scss']
})
export class MovimientosListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource!: MatTableDataSource<MovimientoInventario>;
  displayedColumns: string[] = [
    'fechaMovimiento',
    'tipoMovimiento',
    'nombreItem',
    'cantidad',
    'stockAnterior',
    'stockPosterior',
    'reservaId',
    'nombreUsuario'
  ];

  cargando = false;
  movimientos: MovimientoInventario[] = [];

  // Filtros
  filtroTipo: string = '';
  filtroBusqueda: string = '';

  tiposMovimiento = [
    { value: 'ENTRADA', label: 'Entrada', icon: 'add_circle', color: 'success' },
    { value: 'SALIDA', label: 'Salida', icon: 'remove_circle', color: 'warn' },
    { value: 'DEVOLUCION', label: 'Devolución', icon: 'replay', color: 'primary' },
    { value: 'AJUSTE_POSITIVO', label: 'Ajuste +', icon: 'arrow_upward', color: 'accent' },
    { value: 'AJUSTE_NEGATIVO', label: 'Ajuste -', icon: 'arrow_downward', color: 'accent' },
    { value: 'PERDIDA', label: 'Pérdida', icon: 'warning', color: 'warn' },
    { value: 'DANO', label: 'Daño', icon: 'broken_image', color: 'warn' }
  ];

  // Estadísticas
  totalEntradas = 0;
  totalSalidas = 0;
  totalDevoluciones = 0;
  totalAjustes = 0;

  constructor(
    private movimientoService: MovimientoInventarioService
  ) {
    this.dataSource = new MatTableDataSource<MovimientoInventario>([]);
  }

  ngOnInit(): void {
    this.cargarMovimientos();
    this.cargarEstadisticas();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Configurar filtro personalizado
    this.dataSource.filterPredicate = (data: MovimientoInventario, filter: string): boolean => {
      const searchStr = filter.toLowerCase();

      const matchesSearch =
        (data.nombreItem?.toLowerCase().includes(searchStr) || false) ||
        (data.categoriaItem?.toLowerCase().includes(searchStr) || false) ||
        (data.nombreRecurso?.toLowerCase().includes(searchStr) || false) ||
        (data.nombreUsuario?.toLowerCase().includes(searchStr) || false) ||
        (data.observaciones?.toLowerCase().includes(searchStr) || false);

      const matchesTipo = !this.filtroTipo || data.tipoMovimiento === this.filtroTipo;

      return matchesSearch && matchesTipo;
    };
  }

  cargarMovimientos(): void {
    this.cargando = true;
    this.movimientoService.obtenerMovimientos().subscribe({
      next: (movimientos) => {
        this.movimientos = movimientos;
        this.dataSource.data = movimientos;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar movimientos:', error);
        this.cargando = false;
      }
    });
  }

  cargarEstadisticas(): void {
    this.movimientoService.obtenerEstadisticas().subscribe({
      next: (stats) => {
        this.totalEntradas = stats.totalEntradas;
        this.totalSalidas = stats.totalSalidas;
        this.totalDevoluciones = stats.totalDevoluciones;
        this.totalAjustes = stats.totalAjustes;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
      }
    });
  }

  aplicarFiltros(): void {
    const filterValue = this.filtroBusqueda.trim().toLowerCase();
    this.dataSource.filter = filterValue;

    // Forzar actualización
    if (!filterValue) {
      this.dataSource.filter = ' ';
      this.dataSource.filter = '';
    }

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  limpiarFiltros(): void {
    this.filtroTipo = '';
    this.filtroBusqueda = '';
    this.dataSource.filter = '';

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getTipoInfo(tipo: string): any {
    return this.tiposMovimiento.find(t => t.value === tipo) || this.tiposMovimiento[0];
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getVariacionStock(movimiento: MovimientoInventario): number {
    return movimiento.stockPosterior - movimiento.stockAnterior;
  }
}
