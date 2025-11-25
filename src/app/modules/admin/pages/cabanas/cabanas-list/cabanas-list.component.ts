import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Cabana } from '../../../../../core/models/cabana.model';
import { EstadoRecurso } from '../../../../../core/models/enums.model';
import { CabanaService } from '../../../../../core/services/cabana.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cabanas-list',
  templateUrl: './cabanas-list.component.html',
  styleUrls: ['./cabanas-list.component.scss']
})
export class CabanasListComponent implements OnInit, AfterViewInit {

  // MatTable configuration
  displayedColumns: string[] = ['imagen', 'nombre', 'tipo', 'capacidad', 'habitaciones', 'precio', 'estado', 'reservas', 'acciones'];
  dataSource = new MatTableDataSource<Cabana>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  loading = false;

  // Filtros
  estadoFiltro: string = '';
  busquedaTexto: string = '';

  // Estadísticas
  stats = {
    total: 0,
    disponibles: 0,
    enMantenimiento: 0,
    fueraServicio: 0
  };

  // Estados disponibles
  estados = [
    { value: 'DISPONIBLE', label: 'Disponible' },
    { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
    { value: 'FUERA_SERVICIO', label: 'Fuera de Servicio' }
  ];

  constructor(
    private cabanaService: CabanaService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarCabanas();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Configurar filtro personalizado
    this.dataSource.filterPredicate = (data: Cabana, filter: string) => {
      const searchStr = filter.toLowerCase();
      const matchesSearch =
        data.nombre.toLowerCase().includes(searchStr) ||
        data.descripcion.toLowerCase().includes(searchStr) ||
        data.tipoCabana.toLowerCase().includes(searchStr);

      const matchesEstado = !this.estadoFiltro || data.estado === this.estadoFiltro;

      return matchesSearch && matchesEstado;
    };
  }

  cargarCabanas(): void {
    this.loading = true;
    this.cabanaService.obtenerTodas().subscribe({
      next: (cabanas) => {
        this.dataSource.data = cabanas;
        this.calcularEstadisticas(cabanas);
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
        console.error('Error al cargar cabañas:', error);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las cabañas',
          confirmButtonColor: '#dc3545'
        });
      }
    });
  }

  calcularEstadisticas(cabanas: Cabana[]): void {
    this.stats = {
      total: cabanas.length,
      disponibles: cabanas.filter(c => c.estado === 'DISPONIBLE').length,
      enMantenimiento: cabanas.filter(c => c.estado === 'MANTENIMIENTO').length,
      fueraServicio: cabanas.filter(c => c.estado === 'FUERA_SERVICIO').length
    };
  }

  aplicarFiltros(): void {
    const filterValue = this.busquedaTexto.trim().toLowerCase();
    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  limpiarFiltros(): void {
    this.estadoFiltro = '';
    this.busquedaTexto = '';
    this.dataSource.filter = '';

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  nuevaCabana(): void {
    this.router.navigate(['/admin/cabanas/nueva']);
  }

  editarCabana(id: number): void {
    this.router.navigate(['/admin/cabanas/editar', id]);
  }

  cambiarEstado(cabana: Cabana): void {
    Swal.fire({
      title: 'Cambiar estado',
      text: `Cabaña: ${cabana.nombre}`,
      input: 'select',
      inputOptions: {
        'DISPONIBLE': 'Disponible',
        'MANTENIMIENTO': 'Mantenimiento',
        'FUERA_SERVICIO': 'Fuera de Servicio'
      },
      inputValue: cabana.estado,
      showCancelButton: true,
      confirmButtonText: 'Cambiar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3f51b5'
    }).then((result) => {
      if (result.isConfirmed && result.value !== cabana.estado) {
        this.loading = true;
        this.cabanaService.cambiarEstado(cabana.id!, result.value).subscribe({
          next: (response) => {
            this.loading = false;
            if (response.success) {
              Swal.fire({
                icon: 'success',
                title: 'Estado actualizado',
                text: response.message,
                confirmButtonColor: '#3f51b5'
              });
              this.cargarCabanas();
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
            console.error('Error al cambiar estado:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo cambiar el estado de la cabaña',
              confirmButtonColor: '#dc3545'
            });
          }
        });
      }
    });
  }

  eliminarCabana(cabana: Cabana): void {
    Swal.fire({
      title: '¿Eliminar cabaña?',
      text: `¿Estás seguro de eliminar "${cabana.nombre}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.cabanaService.eliminarCabana(cabana.id!).subscribe({
          next: (response) => {
            this.loading = false;
            if (response.success) {
              Swal.fire({
                icon: 'success',
                title: 'Cabaña eliminada',
                text: response.message,
                confirmButtonColor: '#3f51b5'
              });
              this.cargarCabanas();
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
            console.error('Error al eliminar cabaña:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'No se pudo eliminar la cabaña',
              confirmButtonColor: '#dc3545'
            });
          }
        });
      }
    });
  }

  getEstadoChipClass(estado: string): string {
    switch (estado) {
      case 'DISPONIBLE':
        return 'chip-disponible';
      case 'MANTENIMIENTO':
        return 'chip-mantenimiento';
      case 'FUERA_SERVICIO':
        return 'chip-fuera-servicio';
      default:
        return '';
    }
  }

  getTipoCabanaLabel(tipo: string): string {
    const labels: { [key: string]: string } = {
      'ECONOMICA': 'Económica',
      'STANDARD': 'Standard',
      'PREMIUM': 'Premium',
      'DELUXE': 'Deluxe'
    };
    return labels[tipo] || tipo;
  }

  getTipoChipClass(tipo: string): string {
    switch (tipo) {
      case 'ECONOMICA':
        return 'chip-economica';
      case 'STANDARD':
        return 'chip-standard';
      case 'PREMIUM':
        return 'chip-premium';
      case 'DELUXE':
        return 'chip-deluxe';
      default:
        return '';
    }
  }

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/images/default-service.svg';
  }

  exportarCSV(): void {
    const data = this.dataSource.filteredData;

    if (data.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin datos',
        text: 'No hay cabañas para exportar',
        confirmButtonColor: '#3f51b5'
      });
      return;
    }

    const csv = this.convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `cabanas_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'Exportado',
      text: `${data.length} cabañas exportadas exitosamente`,
      timer: 2000,
      showConfirmButton: false
    });
  }

  private convertToCSV(data: Cabana[]): string {
    const headers = ['ID', 'Nombre', 'Tipo', 'Capacidad', 'Habitaciones', 'Baños', 'Precio', 'Estado', 'Metros²', 'Total Reservas'];
    const rows = data.map(cabana => [
      cabana.id,
      cabana.nombre,
      this.getTipoCabanaLabel(cabana.tipoCabana),
      cabana.capacidadPersonas,
      cabana.numeroHabitaciones,
      cabana.numeroBanos,
      cabana.precioPorUnidad,
      cabana.estado,
      cabana.metrosCuadrados,
      cabana.totalReservas || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }
}
