import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ReservaService } from '../../../../../core/services/reserva.service';
import { CabanaService } from '../../../../../core/services/cabana.service';
import { ServicioEntretencionService } from '../../../../../core/services/servicio-entretencion.service';
import { InventarioService } from '../../../../../core/services/inventario.service';
import { UserService } from '../../../../../core/services/UserService.service';
import { ReservaCabanaRequest, ReservaServicioRequest, ItemReservaDTO } from '../../../../../core/models/reserva.model';
import { Cabana } from '../../../../../core/models/cabana.model';
import { ServicioEntretencion } from '../../../../../core/models/servicio.model';
import { ItemInventario, EstadoItem } from '../../../../../core/models/inventario.model';
import { User } from '../../../../../shared/models/User';

@Component({
  selector: 'app-reserva-form',
  templateUrl: './reserva-form.component.html',
  styleUrls: ['./reserva-form.component.scss']
})
export class ReservaFormComponent implements OnInit {

  tipoReservaForm!: FormGroup;
  reservaCabanaForm!: FormGroup;
  reservaServicioForm!: FormGroup;

  // Flags
  cargando = false;
  tipoSeleccionado: 'cabana' | 'servicio' | null = null;
  mostrarItems = false;

  // Datos
  usuarios: User[] = [];
  cabanas: Cabana[] = [];
  servicios: ServicioEntretencion[] = [];
  itemsInventario: ItemInventario[] = [];
  itemsSeleccionados: ItemReservaDTO[] = [];

  // Disponibilidad
  cabanaSeleccionada: Cabana | null = null;
  servicioSeleccionado: ServicioEntretencion | null = null;
  minDate: string;
  horariosDisponibles: string[] = [];

  constructor(
    private fb: FormBuilder,
    private reservaService: ReservaService,
    private cabanaService: CabanaService,
    private servicioService: ServicioEntretencionService,
    private inventarioService: InventarioService,
    private userService: UserService,
    private router: Router
  ) {
    // Fecha mínima es hoy
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.inicializarFormularios();
    this.cargarDatos();
  }

  inicializarFormularios(): void {
    // Formulario de selección de tipo
    this.tipoReservaForm = this.fb.group({
      tipo: ['', Validators.required]
    });

    // Formulario de reserva de cabaña
    this.reservaCabanaForm = this.fb.group({
      clienteId: ['', Validators.required],
      cabanaId: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      observaciones: ['', Validators.maxLength(500)]
    });

    // Formulario de reserva de servicio
    this.reservaServicioForm = this.fb.group({
      clienteId: ['', Validators.required],
      servicioId: ['', Validators.required],
      fecha: ['', Validators.required],
      horaInicio: ['', Validators.required],
      duracionBloques: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      observaciones: ['', Validators.maxLength(500)]
    });

    // Listener para cambio de tipo
    this.tipoReservaForm.get('tipo')?.valueChanges.subscribe(tipo => {
      this.tipoSeleccionado = tipo;
      this.resetearFormularios();
    });

    // Listeners para cabaña
    this.reservaCabanaForm.get('cabanaId')?.valueChanges.subscribe(id => {
      if (id) {
        this.cargarCabanaSeleccionada(id);
      }
    });

    // Listeners para servicio
    this.reservaServicioForm.get('servicioId')?.valueChanges.subscribe(id => {
      if (id) {
        this.cargarServicioSeleccionado(id);
      }
    });

    this.reservaServicioForm.get('fecha')?.valueChanges.subscribe(() => {
      this.generarHorariosDisponibles();
    });
  }

  cargarDatos(): void {
    this.cargando = true;

    // Cargar usuarios
    this.userService.getAllUsers().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios.filter(u => u.enabled);
      },
      error: (error) => console.error('Error al cargar usuarios:', error)
    });

    // Cargar cabañas
    this.cabanaService.obtenerTodas().subscribe({
      next: (cabanas) => {
        this.cabanas = cabanas.filter(c => c.estado === 'DISPONIBLE');
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar cabañas:', error);
        this.cargando = false;
      }
    });

    // Cargar servicios
    this.servicioService.obtenerTodos().subscribe({
      next: (servicios) => {
        this.servicios = servicios.filter(s => s.estado === 'DISPONIBLE');
      },
      error: (error) => console.error('Error al cargar servicios:', error)
    });

    // Cargar inventario - Solo items en buen estado (NUEVO o BUENO)
    this.inventarioService.obtenerTodos().subscribe({
      next: (items) => {
        this.itemsInventario = items.filter(i => i.estadoItem === EstadoItem.NUEVO || i.estadoItem === EstadoItem.BUENO);
      },
      error: (error) => console.error('Error al cargar inventario:', error)
    });
  }

  resetearFormularios(): void {
    this.reservaCabanaForm.reset();
    this.reservaServicioForm.reset();
    this.itemsSeleccionados = [];
    this.mostrarItems = false;
    this.cabanaSeleccionada = null;
    this.servicioSeleccionado = null;
  }

  cargarCabanaSeleccionada(id: number): void {
    this.cabanaSeleccionada = this.cabanas.find(c => c.id === id) || null;
  }

  cargarServicioSeleccionado(id: number): void {
    this.servicioSeleccionado = this.servicios.find(s => s.id === id) || null;
    this.generarHorariosDisponibles();
  }

  generarHorariosDisponibles(): void {
    if (!this.servicioSeleccionado) {
      this.horariosDisponibles = [];
      return;
    }

    // Generar horarios desde las 8:00 hasta las 20:00
    const horarios: string[] = [];
    for (let h = 8; h <= 20; h++) {
      horarios.push(`${h.toString().padStart(2, '0')}:00`);
      if (h < 20) {
        horarios.push(`${h.toString().padStart(2, '0')}:30`);
      }
    }
    this.horariosDisponibles = horarios;
  }

  agregarItem(): void {
    Swal.fire({
      title: 'Agregar Item',
      html: `
        <select id="itemId" class="swal2-input">
          <option value="">Seleccione un item</option>
          ${this.itemsInventario.map(i =>
            `<option value="${i.id}">${i.nombre} (Disponible: ${i.cantidadDisponible || i.cantidadTotal})</option>`
          ).join('')}
        </select>
        <input id="cantidad" type="number" class="swal2-input" placeholder="Cantidad" min="1" value="1">
      `,
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3f51b5',
      preConfirm: () => {
        const itemId = (document.getElementById('itemId') as HTMLSelectElement).value;
        const cantidad = parseInt((document.getElementById('cantidad') as HTMLInputElement).value);

        if (!itemId || cantidad < 1) {
          Swal.showValidationMessage('Por favor complete todos los campos');
          return null;
        }

        const item = this.itemsInventario.find(i => i.id === parseInt(itemId));
        const disponible = item?.cantidadDisponible || item?.cantidadTotal || 0;

        if (cantidad > disponible) {
          Swal.showValidationMessage(`Solo hay ${disponible} unidades disponibles`);
          return null;
        }

        return { itemId: parseInt(itemId), cantidad };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.itemsSeleccionados.push(result.value);
        Swal.fire({
          icon: 'success',
          title: 'Item agregado',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  }

  eliminarItem(index: number): void {
    this.itemsSeleccionados.splice(index, 1);
  }

  getNombreItem(itemId: number): string {
    return this.itemsInventario.find(i => i.id === itemId)?.nombre || 'Item desconocido';
  }

  crearReserva(): void {
    if (this.tipoSeleccionado === 'cabana') {
      this.crearReservaCabana();
    } else if (this.tipoSeleccionado === 'servicio') {
      this.crearReservaServicio();
    }
  }

  crearReservaCabana(): void {
    if (this.reservaCabanaForm.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Formulario inválido',
        text: 'Por favor complete todos los campos requeridos',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    const formValue = this.reservaCabanaForm.value;

    // Validar fechas
    const fechaInicio = new Date(formValue.fechaInicio);
    const fechaFin = new Date(formValue.fechaFin);

    if (fechaFin <= fechaInicio) {
      Swal.fire({
        icon: 'error',
        title: 'Fechas inválidas',
        text: 'La fecha de fin debe ser posterior a la fecha de inicio',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    const request: ReservaCabanaRequest = {
      cabanaId: formValue.cabanaId,
      clienteId: formValue.clienteId,
      fechaInicio: formValue.fechaInicio,
      fechaFin: formValue.fechaFin,
      itemsAdicionales: this.itemsSeleccionados.length > 0 ? this.itemsSeleccionados : undefined,
      observaciones: formValue.observaciones || undefined
    };

    this.cargando = true;
    this.reservaService.reservarCabana(request).subscribe({
      next: (response) => {
        this.cargando = false;
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: 'Reserva creada',
            text: response.message,
            confirmButtonColor: '#3f51b5'
          }).then(() => {
            this.router.navigate(['/admin/reservas', response.data.id]);
          });
        }
      },
      error: (error) => {
        this.cargando = false;
        console.error('Error al crear reserva:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudo crear la reserva',
          confirmButtonColor: '#dc3545'
        });
      }
    });
  }

  crearReservaServicio(): void {
    if (this.reservaServicioForm.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Formulario inválido',
        text: 'Por favor complete todos los campos requeridos',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    const formValue = this.reservaServicioForm.value;

    const request: ReservaServicioRequest = {
      servicioId: formValue.servicioId,
      clienteId: formValue.clienteId,
      fecha: formValue.fecha,
      horaInicio: formValue.horaInicio,
      duracionBloques: formValue.duracionBloques,
      equipamiento: this.itemsSeleccionados.length > 0 ? this.itemsSeleccionados : undefined,
      observaciones: formValue.observaciones || undefined
    };

    this.cargando = true;
    this.reservaService.reservarServicio(request).subscribe({
      next: (response) => {
        this.cargando = false;
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: 'Reserva creada',
            text: response.message,
            confirmButtonColor: '#3f51b5'
          }).then(() => {
            this.router.navigate(['/admin/reservas', response.data.id]);
          });
        }
      },
      error: (error) => {
        this.cargando = false;
        console.error('Error al crear reserva:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudo crear la reserva',
          confirmButtonColor: '#dc3545'
        });
      }
    });
  }

  calcularPrecioEstimado(): number {
    if (this.tipoSeleccionado === 'cabana' && this.cabanaSeleccionada) {
      const formValue = this.reservaCabanaForm.value;
      if (formValue.fechaInicio && formValue.fechaFin) {
        const dias = this.calcularDias(formValue.fechaInicio, formValue.fechaFin);
        return this.cabanaSeleccionada.precioPorUnidad * dias;
      }
    } else if (this.tipoSeleccionado === 'servicio' && this.servicioSeleccionado) {
      const bloques = this.reservaServicioForm.value.duracionBloques || 1;
      return this.servicioSeleccionado.precioPorUnidad * bloques;
    }
    return 0;
  }

  calcularDias(fechaInicio: string, fechaFin: string): number {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(precio);
  }

  cancelar(): void {
    this.router.navigate(['/admin/reservas']);
  }
}
