import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ServicioEntretencion, TipoServicio } from '../../../../../core/models/servicio.model';
import { EstadoRecurso } from '../../../../../core/models/enums.model';
import { ServicioEntretencionService } from '../../../../../core/services/servicio-entretencion.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-servicios-list',
  templateUrl: './servicios-list.component.html',
  styleUrls: ['./servicios-list.component.scss']
})
export class ServiciosListComponent implements OnInit, AfterViewInit {

  // MatTable configuration
  displayedColumns: string[] = ['imagen', 'nombre', 'tipo', 'duracion', 'precio', 'capacidad', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<ServicioEntretencion>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  loading = false;

  // Filtros
  estadoFiltro: string = '';
  tipoFiltro: string = '';
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

  // Tipos de servicio
  tipos = [
    { value: 'CANCHA_TENIS', label: 'Cancha de Tenis' },
    { value: 'CANCHA_FUTBOL', label: 'Cancha de Fútbol' },
    { value: 'PISCINA', label: 'Piscina' },
    { value: 'QUINCHO', label: 'Quincho' },
    { value: 'SPA', label: 'Spa' },
    { value: 'GIMNASIO', label: 'Gimnasio' },
    { value: 'SALA_JUEGOS', label: 'Sala de Juegos' },
    { value: 'SALON_EVENTOS', label: 'Salón de Eventos' }
  ];

  constructor(
    private servicioService: ServicioEntretencionService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarServicios();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Configurar filtro personalizado
    this.dataSource.filterPredicate = (data: ServicioEntretencion, filter: string) => {
      const searchStr = filter.toLowerCase();
      const matchesSearch =
        data.nombre.toLowerCase().includes(searchStr) ||
        data.descripcion.toLowerCase().includes(searchStr) ||
        this.getTipoServicioLabel(data.tipoServicio).toLowerCase().includes(searchStr);

      const matchesEstado = !this.estadoFiltro || data.estado === this.estadoFiltro;
      const matchesTipo = !this.tipoFiltro || data.tipoServicio === this.tipoFiltro;

      return matchesSearch && matchesEstado && matchesTipo;
    };
  }

  cargarServicios(): void {
    this.loading = true;
    this.servicioService.obtenerTodos().subscribe({
      next: (servicios) => {
        this.dataSource.data = servicios;
        this.calcularEstadisticas(servicios);
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
        console.error('Error al cargar servicios:', error);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los servicios',
          confirmButtonColor: '#dc3545'
        });
      }
    });
  }

  calcularEstadisticas(servicios: ServicioEntretencion[]): void {
    this.stats = {
      total: servicios.length,
      disponibles: servicios.filter(s => s.estado === 'DISPONIBLE').length,
      enMantenimiento: servicios.filter(s => s.estado === 'MANTENIMIENTO').length,
      fueraServicio: servicios.filter(s => s.estado === 'FUERA_SERVICIO').length
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
    this.tipoFiltro = '';
    this.busquedaTexto = '';
    this.dataSource.filter = '';

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  nuevoServicio(): void {
    this.router.navigate(['/admin/servicios/nuevo']);
  }

  editarServicio(id: number): void {
    this.router.navigate(['/admin/servicios/editar', id]);
  }

  cambiarEstado(servicio: ServicioEntretencion): void {
    Swal.fire({
      title: 'Cambiar estado',
      text: `Servicio: ${servicio.nombre}`,
      input: 'select',
      inputOptions: {
        'DISPONIBLE': 'Disponible',
        'MANTENIMIENTO': 'Mantenimiento',
        'FUERA_SERVICIO': 'Fuera de Servicio'
      },
      inputValue: servicio.estado,
      showCancelButton: true,
      confirmButtonText: 'Cambiar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3f51b5'
    }).then((result) => {
      if (result.isConfirmed && result.value !== servicio.estado) {
        this.loading = true;
        this.servicioService.cambiarEstado(servicio.id!, result.value).subscribe({
          next: (response) => {
            this.loading = false;
            if (response.success) {
              Swal.fire({
                icon: 'success',
                title: 'Estado actualizado',
                text: response.message,
                confirmButtonColor: '#3f51b5'
              });
              this.cargarServicios();
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
              text: 'No se pudo cambiar el estado del servicio',
              confirmButtonColor: '#dc3545'
            });
          }
        });
      }
    });
  }

  eliminarServicio(servicio: ServicioEntretencion): void {
    Swal.fire({
      title: '¿Eliminar servicio?',
      text: `¿Estás seguro de eliminar "${servicio.nombre}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.servicioService.eliminarServicio(servicio.id!).subscribe({
          next: (response) => {
            this.loading = false;
            if (response.success) {
              Swal.fire({
                icon: 'success',
                title: 'Servicio eliminado',
                text: response.message,
                confirmButtonColor: '#3f51b5'
              });
              this.cargarServicios();
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
            console.error('Error al eliminar servicio:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'No se pudo eliminar el servicio',
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

  getTipoServicioLabel(tipo: string): string {
    const labels: { [key: string]: string } = {
      'CANCHA_TENIS': 'Cancha de Tenis',
      'CANCHA_FUTBOL': 'Cancha de Fútbol',
      'PISCINA': 'Piscina',
      'QUINCHO': 'Quincho',
      'SPA': 'Spa',
      'GIMNASIO': 'Gimnasio',
      'SALA_JUEGOS': 'Sala de Juegos',
      'SALON_EVENTOS': 'Salón de Eventos'
    };
    return labels[tipo] || tipo;
  }

  getTipoChipClass(tipo: string): string {
    const typeMap: { [key: string]: string } = {
      'CANCHA_TENIS': 'chip-tenis',
      'CANCHA_FUTBOL': 'chip-futbol',
      'PISCINA': 'chip-piscina',
      'QUINCHO': 'chip-quincho',
      'SPA': 'chip-spa',
      'GIMNASIO': 'chip-gimnasio',
      'SALA_JUEGOS': 'chip-juegos',
      'SALON_EVENTOS': 'chip-eventos'
    };
    return typeMap[tipo] || '';
  }

  getDuracionLabel(minutos: number): string {
    if (minutos >= 60) {
      const horas = minutos / 60;
      return `${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    }
    return `${minutos} min`;
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(precio);
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
        text: 'No hay servicios para exportar',
        confirmButtonColor: '#3f51b5'
      });
      return;
    }

    const csv = this.convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `servicios_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'Exportado',
      text: `${data.length} servicios exportados exitosamente`,
      timer: 2000,
      showConfirmButton: false
    });
  }

  private convertToCSV(data: ServicioEntretencion[]): string {
    const headers = ['ID', 'Nombre', 'Tipo', 'Duración (min)', 'Precio', 'Capacidad', 'Estado'];
    const rows = data.map(servicio => [
      servicio.id,
      servicio.nombre,
      this.getTipoServicioLabel(servicio.tipoServicio),
      servicio.duracionBloqueMinutos,
      servicio.precioPorUnidad,
      servicio.capacidadMaxima,
      servicio.estado
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }
}
