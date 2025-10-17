import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { User } from 'src/app/shared/models/User';
import Swal from 'sweetalert2';
import { UserService } from '../../../../../core/services/UserService.service';

@Component({
  selector: 'app-usuarios-list',
  templateUrl: './usuarios-list.component.html',
  styleUrls: ['./usuarios-list.component.scss'],
})
export class UsuariosListComponent implements OnInit, AfterViewInit {
  // MatTable configuration
  displayedColumns: string[] = ['id', 'username', 'nombreCompleto', 'email', 'telefono', 'rol', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<User>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  loading = true;
  searchTerm = '';

  // Estadísticas
  stats = {
    total: 0,
    activos: 0,
    inactivos: 0,
  };

  constructor(
    private userService: UserService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadUsuarios();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Configurar filtro personalizado
    this.dataSource.filterPredicate = (data: User, filter: string) => {
      const searchStr = filter.toLowerCase();
      return (
        data.username.toLowerCase().includes(searchStr) ||
        (data.email?.toLowerCase() || '').includes(searchStr) ||
        (data.nombres?.toLowerCase() || '').includes(searchStr) ||
        (data.apellidos?.toLowerCase() || '').includes(searchStr) ||
        (data.documento?.toLowerCase() || '').includes(searchStr) ||
        (data.telefono?.toLowerCase() || '').includes(searchStr)
      );
    };
  }

  loadUsuarios(): void {
    this.loading = true;

    this.userService.getAllUsers().subscribe({
      next: (usuarios) => {
        this.dataSource.data = usuarios;
        this.calcularEstadisticas(usuarios);
        this.loading = false;

        // Asegurar que el paginador se conecte después de cargar datos
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

  calcularEstadisticas(usuarios: User[]): void {
    this.stats.total = usuarios.length;
    this.stats.activos = usuarios.filter((u) => u.enabled).length;
    this.stats.inactivos = usuarios.filter((u) => !u.enabled).length;
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.dataSource.filter = '';
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
        this.userService.toggleUserStatus(usuario.id).subscribe({
          next: () => {
            usuario.enabled = !usuario.enabled;

            // Actualizar dataSource
            const data = this.dataSource.data;
            const index = data.findIndex(u => u.id === usuario.id);
            if (index > -1) {
              data[index] = usuario;
              this.dataSource.data = [...data];
            }

            this.calcularEstadisticas(this.dataSource.data);

            Swal.fire({
              icon: 'success',
              title: '¡Actualizado!',
              text: `Usuario ${
                accion === 'activar' ? 'activado' : 'desactivado'
              } correctamente`,
              confirmButtonColor: '#3f51b5',
            });
          },
          error: (error) => {
            console.error('Error al cambiar estado:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo cambiar el estado del usuario',
              confirmButtonColor: '#dc3545',
            });
          },
        });
      }
    });
  }

  eliminarUsuario(usuario: User): void {
    Swal.fire({
      title: '¿Eliminar usuario?',
      html: `<p>Esta acción no se puede deshacer</p><p><strong>${usuario.nombreCompleto || usuario.username}</strong></p>`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.deleteUser(usuario.id).subscribe({
          next: () => {
            this.loadUsuarios();

            Swal.fire({
              icon: 'success',
              title: '¡Eliminado!',
              text: 'Usuario eliminado correctamente',
              confirmButtonColor: '#3f51b5',
            });
          },
          error: (error) => {
            console.error('Error al eliminar usuario:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el usuario',
              confirmButtonColor: '#dc3545',
            });
          },
        });
      }
    });
  }

  nuevoUsuario(): void {
    this.router.navigate(['/admin/usuarios/nuevo']);
  }

  exportarCSV(): void {
    const data = this.dataSource.filteredData;
    const csv = this.convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `usuarios_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'Exportado',
      text: 'Archivo CSV descargado exitosamente',
      confirmButtonColor: '#3f51b5',
      timer: 2000,
    });
  }

  private convertToCSV(data: User[]): string {
    const headers = ['ID', 'Username', 'Nombre Completo', 'Email', 'Teléfono', 'Documento', 'Estado'];
    const rows = data.map(u => [
      u.id,
      u.username,
      u.nombreCompleto || `${u.nombres} ${u.apellidos}`,
      u.email || '',
      u.telefono || '',
      u.documento || '',
      u.enabled ? 'Activo' : 'Inactivo'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }

  getRolDisplay(usuario: User): string {
    if (usuario.roles && usuario.roles.length > 0) {
      return usuario.roles[0].name;
    }
    return 'Sin rol';
  }
}
