import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { InventarioService } from '../../../../../core/services/inventario.service';
import { ItemInventario, EstadoItem, CategoriaInventario } from '../../../../../core/models/inventario.model';

@Component({
  selector: 'app-inventario-list',
  templateUrl: './inventario-list.component.html',
  styleUrls: ['./inventario-list.component.scss']
})
export class InventarioListComponent implements OnInit {
  items: ItemInventario[] = [];
  itemsFiltrados: ItemInventario[] = [];
  filtroEstado: string = '';
  filtroCategoria: string = '';
  filtroBusqueda: string = '';
  cargando: boolean = false;

  estadosItem = Object.values(EstadoItem);
  categorias = Object.values(CategoriaInventario);

  constructor(
    private inventarioService: InventarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarItems();
  }

  cargarItems(): void {
    this.cargando = true;
    this.inventarioService.obtenerTodos().subscribe({
      next: (data) => {
        this.items = data;
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar items:', error);
        Swal.fire('Error', 'No se pudieron cargar los items de inventario', 'error');
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.itemsFiltrados = this.items.filter(item => {
      const cumpleEstado = !this.filtroEstado || item.estadoItem === this.filtroEstado;
      const cumpleCategoria = !this.filtroCategoria || item.categoria === this.filtroCategoria;
      const cumpleBusqueda = !this.filtroBusqueda ||
        item.nombre.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
        item.nombreRecurso.toLowerCase().includes(this.filtroBusqueda.toLowerCase());

      return cumpleEstado && cumpleCategoria && cumpleBusqueda;
    });
  }

  nuevo(): void {
    this.router.navigate(['/admin/inventario/nuevo']);
  }

  editar(id: number): void {
    this.router.navigate(['/admin/inventario/editar', id]);
  }

  eliminar(item: ItemInventario): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el item "${item.nombre}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.inventarioService.eliminar(item.id).subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire('Eliminado', response.message, 'success');
              this.cargarItems();
            } else {
              Swal.fire('Error', response.message, 'error');
            }
          },
          error: (error) => {
            console.error('Error al eliminar item:', error);
            Swal.fire('Error', 'No se pudo eliminar el item', 'error');
          }
        });
      }
    });
  }

  getBadgeClass(estado: EstadoItem): string {
    switch (estado) {
      case EstadoItem.DISPONIBLE:
        return 'badge bg-success';
      case EstadoItem.EN_USO:
        return 'badge bg-primary';
      case EstadoItem.MANTENIMIENTO:
        return 'badge bg-warning';
      case EstadoItem.DANADO:
        return 'badge bg-danger';
      case EstadoItem.FUERA_SERVICIO:
        return 'badge bg-secondary';
      default:
        return 'badge bg-secondary';
    }
  }

  formatearEstado(estado: string): string {
    return estado.replace(/_/g, ' ');
  }

  formatearCategoria(categoria: string): string {
    return categoria.replace(/_/g, ' ');
  }
}
