import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CabanaService } from '../../../../core/services/cabana.service';
import { Cabana } from '../../../../core/models/cabana.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cabanas-catalogo',
  templateUrl: './cabanas-catalogo.component.html',
  styleUrls: ['./cabanas-catalogo.component.scss']
})
export class CabanasCatalogoComponent implements OnInit {
  cabanas: Cabana[] = [];
  cabanasFiltradas: Cabana[] = [];
  cargando = true;

  // Filtros
  filtroBusqueda = '';
  filtroCapacidad = 0;
  filtroPrecioMax = 0;
  ordenarPor = 'nombre';

  // Paginación
  paginaActual = 1;
  itemsPorPagina = 9;

  capacidadesDisponibles = [2, 4, 6, 8, 10];

  constructor(
    private cabanaService: CabanaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCabanas();
  }

  cargarCabanas(): void {
    this.cargando = true;
    this.cabanaService.obtenerTodas().subscribe({
      next: (cabanas) => {
        this.cabanas = cabanas;
        this.calcularPrecioMaximo();
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar cabañas:', error);
        Swal.fire('Error', 'No se pudieron cargar las cabañas', 'error');
        this.cargando = false;
      }
    });
  }

  calcularPrecioMaximo(): void {
    if (this.cabanas.length > 0) {
      this.filtroPrecioMax = Math.max(...this.cabanas.map(c => c.precioPorUnidad || 0));
    }
  }

  aplicarFiltros(): void {
    this.cabanasFiltradas = this.cabanas.filter(cabana => {
      const cumpleBusqueda = !this.filtroBusqueda ||
        cabana.nombre.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
        (cabana.descripcion && cabana.descripcion.toLowerCase().includes(this.filtroBusqueda.toLowerCase()));

      const cumpleCapacidad = this.filtroCapacidad === 0 ||
        cabana.capacidadPersonas >= this.filtroCapacidad;

      const cumplePrecio = this.filtroPrecioMax === 0 ||
        (cabana.precioPorUnidad || 0) <= this.filtroPrecioMax;

      return cumpleBusqueda && cumpleCapacidad && cumplePrecio;
    });

    this.ordenarCabanas();
    this.paginaActual = 1;
  }

  ordenarCabanas(): void {
    switch (this.ordenarPor) {
      case 'precio-asc':
        this.cabanasFiltradas.sort((a, b) => (a.precioPorUnidad || 0) - (b.precioPorUnidad || 0));
        break;
      case 'precio-desc':
        this.cabanasFiltradas.sort((a, b) => (b.precioPorUnidad || 0) - (a.precioPorUnidad || 0));
        break;
      case 'capacidad':
        this.cabanasFiltradas.sort((a, b) => b.capacidadPersonas - a.capacidadPersonas);
        break;
      default:
        this.cabanasFiltradas.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
  }

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroCapacidad = 0;
    this.filtroPrecioMax = 0;
    this.aplicarFiltros();
  }

  get cabanasPaginadas(): Cabana[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.cabanasFiltradas.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.cabanasFiltradas.length / this.itemsPorPagina);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  verDetalle(cabana: Cabana): void {
    // Navegar a la página de detalle
    this.router.navigate(['/cabanas', cabana.id]);
  }

  verDetalleModal(cabana: Cabana): void {
    // Generar carousel de imágenes o placeholder (método antiguo por si se necesita)
    let imagenesHTML = '';

    if (cabana.imagenes && cabana.imagenes.length > 0) {
      const carouselId = 'carousel-' + cabana.id;
      const indicadores = cabana.imagenes.map((_, index) =>
        `<button type="button" data-bs-target="#${carouselId}" data-bs-slide-to="${index}"
         ${index === 0 ? 'class="active" aria-current="true"' : ''} aria-label="Slide ${index + 1}"></button>`
      ).join('');

      const slides = cabana.imagenes.map((img, index) =>
        `<div class="carousel-item ${index === 0 ? 'active' : ''}">
          <img src="${img.url}" class="d-block w-100" alt="${img.descripcion || cabana.nombre}"
               style="height: 300px; object-fit: cover; border-radius: 8px;">
          ${img.descripcion ? `<div class="carousel-caption d-none d-md-block"><p class="bg-dark bg-opacity-75 rounded px-2">${img.descripcion}</p></div>` : ''}
        </div>`
      ).join('');

      imagenesHTML = `
        <div id="${carouselId}" class="carousel slide mb-3" data-bs-ride="false">
          <div class="carousel-indicators">${indicadores}</div>
          <div class="carousel-inner">${slides}</div>
          ${cabana.imagenes.length > 1 ? `
            <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
              <span class="carousel-control-prev-icon" aria-hidden="true"></span>
              <span class="visually-hidden">Anterior</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
              <span class="carousel-control-next-icon" aria-hidden="true"></span>
              <span class="visually-hidden">Siguiente</span>
            </button>
          ` : ''}
        </div>
      `;
    } else {
      imagenesHTML = `
        <div class="bg-light d-flex align-items-center justify-content-center mb-3"
             style="height: 300px; border-radius: 8px;">
          <i class="bi bi-house-door" style="font-size: 4rem; color: #6c757d;"></i>
        </div>
      `;
    }

    Swal.fire({
      title: cabana.nombre,
      html: `
        ${imagenesHTML}
        <div class="text-start">
          <p><strong>Descripción:</strong> ${cabana.descripcion || 'Sin descripción'}</p>
          <p><strong>Capacidad:</strong> ${cabana.capacidadPersonas} personas</p>
          <p><strong>Habitaciones:</strong> ${cabana.numeroHabitaciones || 'N/A'}</p>
          <p><strong>Baños:</strong> ${cabana.numeroBanos || 'N/A'}</p>
          <p><strong>Metros cuadrados:</strong> ${cabana.metrosCuadrados || 'N/A'} m²</p>
          <p><strong>Tipo:</strong> ${cabana.tipoCabana}</p>
          ${cabana.serviciosIncluidos ? `<p><strong>Servicios:</strong> ${cabana.serviciosIncluidos}</p>` : ''}
          <p><strong>Estado:</strong> <span class="badge bg-success">${cabana.estado}</span></p>
          <hr>
          <p class="text-center fs-4 text-primary fw-bold">
            $${cabana.precioPorUnidad?.toLocaleString('es-CL')} por noche
          </p>
        </div>
      `,
      width: '800px',
      showCancelButton: true,
      confirmButtonText: 'Reservar',
      cancelButtonText: 'Cerrar',
      confirmButtonColor: '#667eea',
      didOpen: () => {
        // Inicializar el carousel de Bootstrap manualmente
        const carouselElement = document.getElementById('carousel-' + cabana.id);
        if (carouselElement && (window as any).bootstrap) {
          new (window as any).bootstrap.Carousel(carouselElement);
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.reservar(cabana);
      }
    });
  }

  reservar(cabana: Cabana): void {
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
      // Redirigir a la página de nueva reserva del cliente
      this.router.navigate(['/cliente/nueva-reserva'], {
        queryParams: { cabanaId: cabana.id }
      });
    }
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CL').format(precio);
  }

  obtenerImagenPrincipal(cabana: Cabana): string {
    if (cabana.imagenes && cabana.imagenes.length > 0) {
      const imagenPrincipal = cabana.imagenes.find(img => img.esPrincipal);
      return imagenPrincipal ? imagenPrincipal.url : cabana.imagenes[0].url;
    }
    return ''; // Retorna vacío para mostrar placeholder
  }
}
