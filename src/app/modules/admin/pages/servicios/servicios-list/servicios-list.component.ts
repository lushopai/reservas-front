import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ServicioEntretencion, EstadoServicio, TipoServicio } from '../../../../../core/models/servicio.model';
import { ServicioEntretencionService } from '../../../../../core/services/servicio-entretencion.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-servicios-list',
  templateUrl: './servicios-list.component.html',
  styleUrls: ['./servicios-list.component.scss']
})
export class ServiciosListComponent implements OnInit {

  servicios: ServicioEntretencion[] = [];
  serviciosFiltrados: ServicioEntretencion[] = [];
  loading = false;

  // Filtros
  estadoFiltro: string = '';
  tipoFiltro: string = '';
  busquedaTexto: string = '';

  // Enums para los filtros
  estados = Object.values(EstadoServicio);
  tipos = Object.values(TipoServicio);

  constructor(
    private servicioService: ServicioEntretencionService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarServicios();
  }

  cargarServicios(): void {
    this.loading = true;
    this.servicioService.obtenerTodos().subscribe({
      next: (servicios) => {
        this.servicios = servicios;
        this.serviciosFiltrados = servicios;
        this.loading = false;
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

  aplicarFiltros(): void {
    this.serviciosFiltrados = this.servicios.filter(servicio => {
      const coincideEstado = !this.estadoFiltro || servicio.estado === this.estadoFiltro;
      const coincideTipo = !this.tipoFiltro || servicio.tipoServicio === this.tipoFiltro;
      const coincideTexto = !this.busquedaTexto ||
        servicio.nombre.toLowerCase().includes(this.busquedaTexto.toLowerCase()) ||
        servicio.descripcion.toLowerCase().includes(this.busquedaTexto.toLowerCase());

      return coincideEstado && coincideTipo && coincideTexto;
    });
  }

  limpiarFiltros(): void {
    this.estadoFiltro = '';
    this.tipoFiltro = '';
    this.busquedaTexto = '';
    this.serviciosFiltrados = this.servicios;
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
      confirmButtonColor: '#667eea'
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
                confirmButtonColor: '#667eea'
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
                confirmButtonColor: '#667eea'
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

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'DISPONIBLE':
        return 'badge bg-success';
      case 'MANTENIMIENTO':
        return 'badge bg-warning text-dark';
      case 'FUERA_SERVICIO':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
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

  getDuracionLabel(minutos: number): string {
    if (minutos >= 60) {
      const horas = minutos / 60;
      return `${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    }
    return `${minutos} min`;
  }

}
