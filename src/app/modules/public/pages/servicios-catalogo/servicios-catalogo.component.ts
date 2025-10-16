import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ServicioEntretencionService } from '../../../../core/services/servicio-entretencion.service';
import { ServicioEntretencion } from '../../../../core/models/servicio.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-servicios-catalogo',
  templateUrl: './servicios-catalogo.component.html',
  styleUrls: ['./servicios-catalogo.component.scss']
})
export class ServiciosCatalogoComponent implements OnInit {
  servicios: ServicioEntretencion[] = [];
  serviciosFiltrados: ServicioEntretencion[] = [];
  cargando = true;

  // Filtros
  filtroBusqueda = '';
  ordenarPor = 'nombre';

  // Paginación
  paginaActual = 1;
  itemsPorPagina = 9;

  constructor(
    private servicioService: ServicioEntretencionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarServicios();
  }

  cargarServicios(): void {
    this.cargando = true;
    this.servicioService.obtenerTodos().subscribe({
      next: (servicios) => {
        this.servicios = servicios;
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar servicios:', error);
        Swal.fire('Error', 'No se pudieron cargar los servicios', 'error');
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.serviciosFiltrados = this.servicios.filter(servicio => {
      const cumpleBusqueda = !this.filtroBusqueda ||
        servicio.nombre.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
        (servicio.descripcion && servicio.descripcion.toLowerCase().includes(this.filtroBusqueda.toLowerCase()));

      return cumpleBusqueda;
    });

    this.ordenarServicios();
    this.paginaActual = 1;
  }

  ordenarServicios(): void {
    switch (this.ordenarPor) {
      case 'precio-asc':
        this.serviciosFiltrados.sort((a, b) => (a.precioPorUnidad || 0) - (b.precioPorUnidad || 0));
        break;
      case 'precio-desc':
        this.serviciosFiltrados.sort((a, b) => (b.precioPorUnidad || 0) - (a.precioPorUnidad || 0));
        break;
      case 'duracion':
        this.serviciosFiltrados.sort((a, b) => (b.duracionBloqueMinutos || 0) - (a.duracionBloqueMinutos || 0));
        break;
      default:
        this.serviciosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
  }

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.ordenarPor = 'nombre';
    this.aplicarFiltros();
  }

  get serviciosPaginados(): ServicioEntretencion[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.serviciosFiltrados.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.serviciosFiltrados.length / this.itemsPorPagina);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  verDetalle(servicio: ServicioEntretencion): void {
    // Navegar a la página de detalle dedicada
    this.router.navigate(['/servicios', servicio.id]);
  }

  reservar(servicio: ServicioEntretencion): void {
    // Verificar si está autenticado
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire({
        icon: 'info',
        title: 'Inicia sesión',
        text: 'Debes iniciar sesión para hacer una reserva',
        showCancelButton: true,
        confirmButtonText: 'Iniciar Sesión',
        cancelButtonText: 'Registrarse',
        confirmButtonColor: '#667eea'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/auth/login']);
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          this.router.navigate(['/registro']);
        }
      });
    } else {
      // Redirigir a la página de nueva reserva del cliente con el servicio preseleccionado
      this.router.navigate(['/cliente/nueva-reserva'], {
        queryParams: { servicioId: servicio.id }
      });
    }
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CL').format(precio);
  }

  obtenerImagenPrincipal(servicio: ServicioEntretencion): string {
    if (servicio.imagenes && servicio.imagenes.length > 0) {
      const imagenPrincipal = servicio.imagenes.find(img => img.esPrincipal);
      return imagenPrincipal ? imagenPrincipal.url : servicio.imagenes[0].url;
    }
    return ''; // Retorna vacío para mostrar placeholder
  }
}
