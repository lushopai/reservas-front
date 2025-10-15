import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ReservaService } from '../../../../../core/services/reserva.service';
import { Reserva, EstadoReserva } from '../../../../../core/models/reserva.model';

@Component({
  selector: 'app-reservas-list',
  templateUrl: './reservas-list.component.html',
  styleUrls: ['./reservas-list.component.scss']
})
export class ReservasListComponent implements OnInit {
  reservas: Reserva[] = [];
  reservasFiltradas: Reserva[] = [];
  filtroEstado: string = '';
  filtroBusqueda: string = '';
  cargando = false;

  estadosReserva = Object.values(EstadoReserva);

  constructor(
    private reservaService: ReservaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarReservas();
  }

  cargarReservas(): void {
    this.cargando = true;
    this.reservaService.obtenerTodas().subscribe({
      next: (data) => {
        this.reservas = data;
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar reservas:', error);
        Swal.fire('Error', 'No se pudieron cargar las reservas', 'error');
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.reservasFiltradas = this.reservas.filter(reserva => {
      const cumpleEstado = !this.filtroEstado || reserva.estado === this.filtroEstado;
      const cumpleBusqueda = !this.filtroBusqueda ||
        reserva.nombreRecurso?.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
        reserva.nombreUsuario?.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
        reserva.id?.toString().includes(this.filtroBusqueda);

      return cumpleEstado && cumpleBusqueda;
    });

    // Ordenar por fecha más reciente
    this.reservasFiltradas.sort((a, b) => {
      return new Date(b.fechaReserva || b.fechaInicio).getTime() -
             new Date(a.fechaReserva || a.fechaInicio).getTime();
    });
  }

  verDetalle(reserva: Reserva): void {
    // Navegar a la página de detalle con gestión de estados
    this.router.navigate(['/admin/reservas', reserva.id]);
  }

  getBadgeClass(estado: string): string {
    switch (estado) {
      case EstadoReserva.PENDIENTE:
        return 'badge bg-warning';
      case EstadoReserva.CONFIRMADA:
        return 'badge bg-success';
      case EstadoReserva.CANCELADA:
        return 'badge bg-danger';
      case EstadoReserva.COMPLETADA:
        return 'badge bg-info';
      default:
        return 'badge bg-secondary';
    }
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(precio);
  }
}
