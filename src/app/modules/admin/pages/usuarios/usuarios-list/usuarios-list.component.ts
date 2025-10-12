import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'src/app/shared/models/User';
import Swal from 'sweetalert2';
import { UserService } from '../../../../../core/services/UserService.service';

@Component({
  selector: 'app-usuarios-list',
  templateUrl: './usuarios-list.component.html',
  styleUrls: ['./usuarios-list.component.scss'],
})
export class UsuariosListComponent implements OnInit {
  usuarios: User[] = [];
  usuariosFiltrados: User[] = [];
  loading = true;

  // Helper para template
  Math = Math;

  // Filtros
  public searchTerm = '';
  filtroEstado: 'todos' | 'activos' | 'inactivos' = 'todos';

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // Estadísticas
  stats = {
    total: 0,
    activos: 0,
    inactivos: 0,
  };

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    this.loadUsuarios();
  }

  loadUsuarios(): void {
    this.loading = true;

    this.userService.getAllUsers().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.calcularEstadisticas();
        this.aplicarFiltros();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.loading = false;

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los usuarios',
          confirmButtonColor: '#dc3545',
        });
      },
    });
  }

  calcularEstadisticas(): void {
    this.stats.total = this.usuarios.length;
    this.stats.activos = this.usuarios.filter((u) => u.enabled).length;
    this.stats.inactivos = this.usuarios.filter((u) => !u.enabled).length;
  }

  aplicarFiltros(): void {
    let filtered = [...this.usuarios];

    // Filtro de búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.username.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term) ||
          u.nombres?.toLowerCase().includes(term) ||
          u.apellidos?.toLowerCase().includes(term) ||
          u.documento?.toLowerCase().includes(term)
      );
    }



    // Filtro Estado
    if (this.filtroEstado !== 'todos') {
      filtered = filtered.filter((u) =>
        this.filtroEstado === 'activos' ? u.enabled : !u.enabled
      );
    }

    this.usuariosFiltrados = filtered;
    this.totalPages = Math.ceil(
      this.usuariosFiltrados.length / this.itemsPerPage
    );
    this.currentPage = 1;
  }

  get usuariosPaginados(): User[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.usuariosFiltrados.slice(start, end);
  }

  onSearch(): void {
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtroEstado = 'todos';
    this.aplicarFiltros();
  }

  verDetalle(usuario: User): void {
    this.router.navigate(['/admin/usuarios', usuario.id]);
  }

  editarUsuario(usuario: User): void {
    this.router.navigate(['/admin/usuarios', usuario.id, 'editar']);
  }



  cambiarEstado(usuario: User): void {
    const accion = usuario.enabled ? 'desactivar' : 'activar';

    Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario?`,
      text: `¿Estás seguro de ${accion} a ${
        usuario.nombreCompleto || usuario.username
      }?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: usuario.enabled ? '#dc3545' : '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        // TODO: Implementar servicio para cambiar estado
        Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: `Usuario ${
            accion === 'activar' ? 'activado' : 'desactivado'
          } correctamente`,
          confirmButtonColor: '#667eea',
        });
      }
    });
  }

  eliminarUsuario(usuario: User): void {
    Swal.fire({
      title: '¿Eliminar usuario?',
      text: 'Esta acción no se puede deshacer',
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        // TODO: Implementar servicio para eliminar
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'Usuario eliminado correctamente',
          confirmButtonColor: '#667eea',
        });
      }
    });
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }

  exportarCSV(): void {
    // TODO: Implementar exportación
    Swal.fire({
      icon: 'info',
      title: 'Exportar',
      text: 'Funcionalidad de exportación próximamente',
      confirmButtonColor: '#667eea',
    });
  }
}
