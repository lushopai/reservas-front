import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import Swal from 'sweetalert2';
import { InventarioService } from '../../../../../core/services/inventario.service';
import { ItemInventario, EstadoItem, CategoriaInventario } from '../../../../../core/models/inventario.model';

@Component({
  selector: 'app-inventario-list',
  templateUrl: './inventario-list.component.html',
  styleUrls: ['./inventario-list.component.scss']
})
export class InventarioListComponent implements OnInit, AfterViewInit {

  // MatTable configuration
  displayedColumns: string[] = ['nombre', 'categoria', 'recurso', 'cantidadTotal', 'cantidadDisponible', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<ItemInventario>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  loading = false;

  // Filtros
  filtroEstado: string = '';
  filtroCategoria: string = '';
  filtroBusqueda: string = '';

  // Estadísticas
  stats = {
    total: 0,
    disponible: 0,
    enUso: 0,
    mantenimiento: 0,
    danado: 0,
    fueraServicio: 0
  };

  // Estados y categorías - ACTUALIZADO con nuevos valores del backend
  estadosItem = [
    { value: EstadoItem.NUEVO, label: 'Nuevo' },
    { value: EstadoItem.BUENO, label: 'Bueno' },
    { value: EstadoItem.REGULAR, label: 'Regular' },
    { value: EstadoItem.MALO, label: 'Malo' }
  ];

  categorias = [
    { value: CategoriaInventario.MUEBLES, label: 'Muebles' },
    { value: CategoriaInventario.ELECTRODOMESTICOS, label: 'Electrodomésticos' },
    { value: CategoriaInventario.MENAJE, label: 'Menaje' },
    { value: CategoriaInventario.ROPA_CAMA, label: 'Ropa de Cama' },
    { value: CategoriaInventario.ELECTRONICA, label: 'Electrónica' },
    { value: CategoriaInventario.HERRAMIENTAS, label: 'Herramientas' },
    { value: CategoriaInventario.DECORACION, label: 'Decoración' },
    { value: CategoriaInventario.EQUIPAMIENTO_DEPORTIVO, label: 'Equipamiento Deportivo' },
    { value: CategoriaInventario.OTROS, label: 'Otros' }
  ];

  constructor(
    private inventarioService: InventarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarItems();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Configurar filtro personalizado
    this.dataSource.filterPredicate = (data: ItemInventario, filter: string) => {
      const searchStr = filter.toLowerCase();
      const matchesSearch =
        data.nombre.toLowerCase().includes(searchStr) ||
        data.nombreRecurso.toLowerCase().includes(searchStr) ||
        this.getCategoriaLabel(data.categoria).toLowerCase().includes(searchStr);

      const matchesEstado = !this.filtroEstado || data.estadoItem === this.filtroEstado;
      const matchesCategoria = !this.filtroCategoria || data.categoria === this.filtroCategoria;

      return matchesSearch && matchesEstado && matchesCategoria;
    };
  }

  cargarItems(): void {
    this.loading = true;
    this.inventarioService.obtenerTodos().subscribe({
      next: (items) => {
        this.dataSource.data = items;
        this.calcularEstadisticas(items);
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
        console.error('Error al cargar items:', error);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los items de inventario',
          confirmButtonColor: '#3f51b5'
        });
      }
    });
  }

  calcularEstadisticas(items: ItemInventario[]): void {
    // Actualizado con nuevos estados del backend
    this.stats = {
      total: items.length,
      disponible: items.filter(i => i.estadoItem === EstadoItem.NUEVO || i.estadoItem === EstadoItem.BUENO).length,
      enUso: 0,  // Ya no existe EN_USO, se maneja por cantidadDisponible
      mantenimiento: items.filter(i => i.estadoItem === EstadoItem.REGULAR).length,
      danado: items.filter(i => i.estadoItem === EstadoItem.MALO).length,
      fueraServicio: 0  // Ya no existe FUERA_SERVICIO
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
    this.filtroCategoria = '';
    this.filtroBusqueda = '';
    this.dataSource.filter = '';

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  nuevo(): void {
    this.router.navigate(['/admin/inventario/nuevo']);
  }

  editar(id: number): void {
    this.router.navigate(['/admin/inventario/editar', id]);
  }

  eliminar(item: ItemInventario): void {
    Swal.fire({
      title: '¿Eliminar item?',
      text: `¿Estás seguro de eliminar "${item.nombre}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.inventarioService.eliminar(item.id).subscribe({
          next: (response) => {
            this.loading = false;
            if (response.success) {
              Swal.fire({
                icon: 'success',
                title: 'Item eliminado',
                text: response.message,
                confirmButtonColor: '#3f51b5'
              });
              this.cargarItems();
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: response.message,
                confirmButtonColor: '#dc3545'
              });
            }
          },
          error: (error) => {
            this.loading = false;
            console.error('Error al eliminar item:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el item',
              confirmButtonColor: '#dc3545'
            });
          }
        });
      }
    });
  }

  getEstadoChipClass(estado: EstadoItem): string {
    // Actualizado con nuevos estados del backend
    switch (estado) {
      case EstadoItem.NUEVO:
        return 'chip-disponible';  // Verde
      case EstadoItem.BUENO:
        return 'chip-en-uso';  // Azul
      case EstadoItem.REGULAR:
        return 'chip-mantenimiento';  // Amarillo
      case EstadoItem.MALO:
        return 'chip-danado';  // Rojo
      default:
        return '';
    }
  }

  getCategoriaChipClass(categoria: CategoriaInventario): string {
    const categoryMap: { [key: string]: string } = {
      'MUEBLES': 'chip-muebles',
      'ELECTRODOMESTICOS': 'chip-electrodomesticos',
      'MENAJE': 'chip-menaje',
      'ROPA_CAMA': 'chip-ropa-cama',
      'ELECTRONICA': 'chip-electronica',
      'HERRAMIENTAS': 'chip-herramientas',
      'DECORACION': 'chip-decoracion',
      'EQUIPAMIENTO_DEPORTIVO': 'chip-equipamiento-deportivo',
      'OTROS': 'chip-otros'
    };
    return categoryMap[categoria] || '';
  }

  getCategoriaLabel(categoria: CategoriaInventario): string {
    const labels: { [key: string]: string } = {
      'MUEBLES': 'Muebles',
      'ELECTRODOMESTICOS': 'Electrodomésticos',
      'MENAJE': 'Menaje',
      'ROPA_CAMA': 'Ropa de Cama',
      'ELECTRONICA': 'Electrónica',
      'HERRAMIENTAS': 'Herramientas',
      'DECORACION': 'Decoración',
      'EQUIPAMIENTO_DEPORTIVO': 'Equipamiento Deportivo',
      'OTROS': 'Otros'
    };
    return labels[categoria] || categoria;
  }

  getEstadoLabel(estado: EstadoItem): string {
    const labels: { [key: string]: string } = {
      'DISPONIBLE': 'Disponible',
      'EN_USO': 'En Uso',
      'MANTENIMIENTO': 'Mantenimiento',
      'DANADO': 'Dañado',
      'FUERA_SERVICIO': 'Fuera de Servicio'
    };
    return labels[estado] || estado;
  }

  isStockBajo(item: ItemInventario): boolean {
    // Stock bajo basado en cantidad disponible vs total
    if (item.cantidadDisponible !== undefined) {
      return item.cantidadDisponible < (item.cantidadTotal * 0.2);
    }
    return false;
  }

  exportarCSV(): void {
    const data = this.dataSource.filteredData;

    if (data.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin datos',
        text: 'No hay items para exportar',
        confirmButtonColor: '#3f51b5'
      });
      return;
    }

    const csv = this.convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `inventario_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'Exportado',
      text: `${data.length} items exportados exitosamente`,
      timer: 2000,
      showConfirmButton: false
    });
  }

  private convertToCSV(data: ItemInventario[]): string {
    const headers = ['ID', 'Nombre', 'Categoría', 'Recurso', 'Cantidad Total', 'Cantidad Disponible', 'Estado'];
    const rows = data.map(item => [
      item.id,
      item.nombre,
      this.getCategoriaLabel(item.categoria),
      item.nombreRecurso,
      item.cantidadTotal,
      item.cantidadDisponible || item.cantidadTotal,
      this.getEstadoLabel(item.estadoItem)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }
}
