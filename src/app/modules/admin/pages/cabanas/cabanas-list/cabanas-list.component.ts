import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Cabana, EstadoCabana } from '../../../../../core/models/cabana.model';
import { CabanaService } from '../../../../../core/services/cabana.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cabanas-list',
  templateUrl: './cabanas-list.component.html',
  styleUrls: ['./cabanas-list.component.scss']
})
export class CabanasListComponent implements OnInit {

  cabanas: Cabana[] = [];
  cabanasFiltradas: Cabana[] = [];
  loading = false;

  // Filtros
  estadoFiltro: string = '';
  busquedaTexto: string = '';

  // Estados disponibles
  estados = Object.values(EstadoCabana);

  constructor(
    private cabanaService: CabanaService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarCabanas();
  }

  cargarCabanas(): void {
    this.loading = true;
    this.cabanaService.obtenerTodas().subscribe({
      next: (cabanas) => {
        this.cabanas = cabanas;
        this.cabanasFiltradas = cabanas;
        this.loading = false;
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

  aplicarFiltros(): void {
    this.cabanasFiltradas = this.cabanas.filter(cabana => {
      const coincideEstado = !this.estadoFiltro || cabana.estado === this.estadoFiltro;
      const coincideTexto = !this.busquedaTexto ||
        cabana.nombre.toLowerCase().includes(this.busquedaTexto.toLowerCase()) ||
        cabana.descripcion.toLowerCase().includes(this.busquedaTexto.toLowerCase());

      return coincideEstado && coincideTexto;
    });
  }

  limpiarFiltros(): void {
    this.estadoFiltro = '';
    this.busquedaTexto = '';
    this.cabanasFiltradas = this.cabanas;
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
      confirmButtonColor: '#667eea'
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
                confirmButtonColor: '#667eea'
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
                confirmButtonColor: '#667eea'
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

  getTipoCabanaLabel(tipo: string): string {
    const labels: { [key: string]: string } = {
      'ECONOMICA': 'Económica',
      'STANDARD': 'Standard',
      'PREMIUM': 'Premium',
      'DELUXE': 'Deluxe'
    };
    return labels[tipo] || tipo;
  }

}
