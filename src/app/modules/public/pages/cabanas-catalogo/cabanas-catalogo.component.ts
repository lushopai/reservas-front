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
