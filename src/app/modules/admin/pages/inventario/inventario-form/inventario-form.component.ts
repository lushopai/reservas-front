import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';
import { InventarioService } from '../../../../../core/services/inventario.service';
import { CabanaService } from '../../../../../core/services/cabana.service';
import { ServicioEntretencionService } from '../../../../../core/services/servicio-entretencion.service';
import { CategoriaInventario, EstadoItem, ItemInventarioRequest } from '../../../../../core/models/inventario.model';

@Component({
  selector: 'app-inventario-form',
  templateUrl: './inventario-form.component.html',
  styleUrls: ['./inventario-form.component.scss']
})
export class InventarioFormComponent implements OnInit {
  form!: FormGroup;
  modoEdicion = false;
  itemId?: number;
  cargando = false;

  categorias = Object.values(CategoriaInventario);
  estadosItem = Object.values(EstadoItem);
  recursos: Array<{ id: number; nombre: string; tipo: string }> = [];

  constructor(
    private fb: FormBuilder,
    private inventarioService: InventarioService,
    private cabanaService: CabanaService,
    private servicioService: ServicioEntretencionService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.modoEdicion = true;
        this.itemId = Number(id);
      }
      // Cargar recursos primero, y luego el item si estamos en modo edición
      this.cargarRecursos();
    });
  }

  inicializarFormulario(): void {
    this.form = this.fb.group({
      recursoId: ['', Validators.required],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      categoria: ['', Validators.required],
      cantidadTotal: [1, [Validators.required, Validators.min(1)]],
      estadoItem: [EstadoItem.BUENO, Validators.required],  // Cambiado de DISPONIBLE a BUENO (nuevo enum backend)
      esReservable: [false],
      precioReserva: [0, [Validators.required, Validators.min(0)]]
    });
  }

  cargarRecursos(): void {
    this.cargando = true;

    // Usar forkJoin para esperar a que ambas llamadas completen
    forkJoin({
      cabanas: this.cabanaService.obtenerTodas(),
      servicios: this.servicioService.obtenerTodos()
    }).subscribe({
      next: ({ cabanas, servicios }) => {
        // Mapear cabañas
        const recursoCabanas = cabanas
          .filter(c => c.id !== undefined)
          .map(c => ({
            id: c.id!,
            nombre: `${c.nombre} (Cabaña)`,
            tipo: 'CABANA'
          }));

        // Mapear servicios
        const recursoServicios = servicios
          .filter(s => s.id !== undefined)
          .map(s => ({
            id: s.id!,
            nombre: `${s.nombre} (Servicio)`,
            tipo: 'SERVICIO'
          }));

        // Combinar ambos
        this.recursos = [...recursoCabanas, ...recursoServicios];
        this.cargando = false;

        // Si estamos en modo edición, cargar el item DESPUÉS de tener los recursos
        if (this.modoEdicion && this.itemId) {
          this.cargarItem(this.itemId);
        }
      },
      error: (error) => {
        console.error('Error al cargar recursos:', error);
        Swal.fire('Error', 'No se pudieron cargar los recursos', 'error');
        this.cargando = false;
      }
    });
  }

  cargarItem(id: number): void {
    this.cargando = true;
    this.inventarioService.obtenerPorId(id).subscribe({
      next: (item) => {
        this.form.patchValue({
          recursoId: item.recursoId,
          nombre: item.nombre,
          categoria: item.categoria,
          cantidadTotal: item.cantidadTotal,
          estadoItem: item.estadoItem,
          esReservable: item.esReservable,
          precioReserva: item.precioReserva
        });
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar item:', error);
        Swal.fire('Error', 'No se pudo cargar el item', 'error');
        this.cargando = false;
        this.volver();
      }
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const request: ItemInventarioRequest = this.form.value;

    const operacion = this.modoEdicion
      ? this.inventarioService.actualizar(this.itemId!, request)
      : this.inventarioService.crear(request);

    operacion.subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire(
            'Éxito',
            this.modoEdicion ? 'Item actualizado correctamente' : 'Item creado correctamente',
            'success'
          );
          this.volver();
        } else {
          Swal.fire('Error', response.message, 'error');
          this.cargando = false;
        }
      },
      error: (error) => {
        console.error('Error al guardar item:', error);
        const mensaje = error.error?.message || 'No se pudo guardar el item';
        Swal.fire('Error', mensaje, 'error');
        this.cargando = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/admin/inventario']);
  }

  formatearCategoria(categoria: string): string {
    return categoria.replace(/_/g, ' ');
  }

  formatearEstado(estado: string): string {
    return estado.replace(/_/g, ' ');
  }

  // Helpers de validación
  campoEsInvalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  obtenerMensajeError(campo: string): string {
    const control = this.form.get(campo);
    if (control?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control?.hasError('minlength')) {
      return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('min')) {
      return `El valor mínimo es ${control.errors?.['min'].min}`;
    }
    return '';
  }
}
