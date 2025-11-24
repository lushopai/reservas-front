import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CabanaService } from '../../../../core/services/cabana.service';
import { ServicioEntretencionService } from '../../../../core/services/servicio-entretencion.service';
import { ReservaService } from '../../../../core/services/reserva.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DisponibilidadService } from '../../../../core/services/disponibilidad.service';
import { InventarioService } from '../../../../core/services/inventario.service';
import { BloqueHorarioService } from '../../../../core/services/bloque-horario.service';
import { Cabana } from '../../../../core/models/cabana.model';
import { ServicioEntretencion } from '../../../../core/models/servicio.model';
import { ItemInventario, EstadoItem } from '../../../../core/models/inventario.model';
import { BloqueHorario } from '../../../../core/models/bloque-horario.model';

@Component({
  selector: 'app-nueva-reserva',
  templateUrl: './nueva-reserva.component.html',
  styleUrls: ['./nueva-reserva.component.scss']
})
export class NuevaReservaComponent implements OnInit {
  paso: number = 1;
  tipoReserva: 'cabana' | 'servicio' | null = null;

  // Datos
  cabanas: Cabana[] = [];
  servicios: ServicioEntretencion[] = [];
  itemsDisponibles: ItemInventario[] = [];

  // Formularios
  formCabana!: FormGroup;
  formServicio!: FormGroup;

  // Items seleccionados
  itemsSeleccionados: Map<number, { item: ItemInventario, cantidad: number }> = new Map();

  // Bloques horarios para servicios
  bloquesDisponibles: BloqueHorario[] = [];
  bloqueSeleccionado?: BloqueHorario;
  cargandoBloques = false;

  cargando = false;
  verificandoDisponibilidad = false;
  disponible = false;
  cargandoItems = false;

  // Fecha mínima (hoy)
  get fechaMinima(): string {
    return new Date().toISOString().split('T')[0];
  }

  constructor(
    private fb: FormBuilder,
    private cabanaService: CabanaService,
    private servicioService: ServicioEntretencionService,
    private reservaService: ReservaService,
    private disponibilidadService: DisponibilidadService,
    private inventarioService: InventarioService,
    private bloqueService: BloqueHorarioService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.inicializarFormularios();
  }

  inicializarFormularios(): void {
    this.formCabana = this.fb.group({
      cabanaId: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      observaciones: ['']
    }, { validators: this.fechaFinPosteriorValidator() });

    this.formServicio = this.fb.group({
      servicioId: ['', Validators.required],
      fecha: ['', Validators.required],
      horaInicio: [''], // Se llenará automáticamente al seleccionar bloque
      cantidadBloques: [1, [Validators.required, Validators.min(1), Validators.max(8)]],
      cantidadPersonas: [1, [Validators.required, Validators.min(1)]],
      observaciones: ['']
    });

    // Escuchar cambios en la fecha para cargar bloques
    this.formServicio.get('fecha')?.valueChanges.subscribe(fecha => {
      if (fecha && this.formServicio.get('servicioId')?.value) {
        this.cargarBloquesDisponibles();
      }
    });

    // Escuchar cambios en el servicio para cargar bloques si ya hay fecha
    this.formServicio.get('servicioId')?.valueChanges.subscribe(servicioId => {
      if (servicioId && this.formServicio.get('fecha')?.value) {
        this.cargarBloquesDisponibles();
      }
    });
  }

  // Validador personalizado: fecha fin debe ser posterior a fecha inicio
  fechaFinPosteriorValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const fechaInicio = control.get('fechaInicio')?.value;
      const fechaFin = control.get('fechaFin')?.value;

      if (!fechaInicio || !fechaFin) {
        return null;
      }

      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);

      if (fin <= inicio) {
        return { fechaFinInvalida: true };
      }

      return null;
    };
  }

  seleccionarTipo(tipo: 'cabana' | 'servicio'): void {
    this.tipoReserva = tipo;
    this.paso = 2;
    this.itemsSeleccionados.clear(); // Limpiar items al cambiar tipo

    if (tipo === 'cabana') {
      this.cargarCabanas();
    } else {
      this.cargarServicios();
    }
  }

  cargarCabanas(): void {
    this.cargando = true;
    this.cabanaService.obtenerTodas().subscribe({
      next: (data) => {
        this.cabanas = data.filter(c => c.estado === 'DISPONIBLE');
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar cabañas:', error);
        Swal.fire('Error', 'No se pudieron cargar las cabañas', 'error');
        this.cargando = false;
      }
    });
  }

  cargarServicios(): void {
    this.cargando = true;
    this.servicioService.obtenerTodos().subscribe({
      next: (data) => {
        this.servicios = data.filter(s => s.estado === 'DISPONIBLE');
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar servicios:', error);
        Swal.fire('Error', 'No se pudieron cargar los servicios', 'error');
        this.cargando = false;
      }
    });
  }

  verificarDisponibilidad(): void {
    if (this.tipoReserva === 'cabana' && this.formCabana.invalid) {
      this.formCabana.markAllAsTouched();
      return;
    }

    if (this.tipoReserva === 'servicio' && this.formServicio.invalid) {
      this.formServicio.markAllAsTouched();
      return;
    }

    this.verificandoDisponibilidad = true;

    if (this.tipoReserva === 'cabana') {
      const { cabanaId, fechaInicio, fechaFin } = this.formCabana.value;

      this.disponibilidadService.consultarDisponibilidadCabana(
        cabanaId,
        fechaInicio,
        fechaFin
      ).subscribe({
        next: (response) => {
          this.disponible = response.disponible;
          this.verificandoDisponibilidad = false;

          if (this.disponible) {
            this.paso = 3;
            // Cargar items del inventario para la cabaña seleccionada
            const cabanaId = this.formCabana.get('cabanaId')?.value;
            if (cabanaId) {
              this.cargarItemsInventario(cabanaId);
            }
          } else {
            Swal.fire('No disponible', 'La cabaña no está disponible en estas fechas', 'warning');
          }
        },
        error: (error) => {
          console.error('Error:', error);
          this.verificandoDisponibilidad = false;
          Swal.fire('Error', 'No se pudo verificar disponibilidad', 'error');
        }
      });
    } else {
      // Para servicios, simplemente avanzamos (la validación se hace en el backend)
      this.disponible = true;
      this.paso = 3;
      // Cargar items del inventario para el servicio seleccionado
      const servicioId = this.formServicio.get('servicioId')?.value;
      if (servicioId) {
        this.cargarItemsInventario(servicioId);
      }
    }
  }

  confirmarReserva(): void {
    const user = this.authService.getCurrentUser();
    if (!user || !user.id) {
      Swal.fire('Error', 'Debe iniciar sesión', 'error');
      this.router.navigate(['/auth/login']);
      return;
    }

    console.log('=== CONFIRMAR RESERVA ===');
    console.log('Tipo de reserva:', this.tipoReserva);
    console.log('Items seleccionados:', this.itemsSeleccionados);

    this.cargando = true;

    if (this.tipoReserva === 'cabana') {
      console.log('Entrando a bloque CABAÑA');
      const request = {
        ...this.formCabana.value,
        clienteId: user.id,
        itemsAdicionales: this.getItemsParaReserva()
      };

      this.reservaService.reservarCabana(request).subscribe({
        next: (response) => {
          if (response.success) {
            Swal.fire({
              title: '¡Reserva creada!',
              html: `
                <p>Su reserva ha sido creada exitosamente.</p>
                <p><strong>ID:</strong> #${response.data.id}</p>
                <p><strong>Estado:</strong> PENDIENTE</p>
                <p class="text-muted">Puede ver sus reservas en "Mis Reservas"</p>
              `,
              icon: 'success',
              confirmButtonText: 'Ver Mis Reservas'
            }).then(() => {
              this.router.navigate(['/cliente/mis-reservas']);
            });
          }
        },
        error: (error) => {
          console.error('Error:', error);
          const mensaje = error.error?.message || 'No se pudo crear la reserva';
          Swal.fire('Error', mensaje, 'error');
          this.cargando = false;
        }
      });
    } else {
      console.log("aca")
      const formValues = this.formServicio.value;
      const equipamientoArray = this.getItemsParaReserva();

      console.log('=== DEBUG RESERVA SERVICIO ===');
      console.log('Items seleccionados (Map):', this.itemsSeleccionados);
      console.log('Equipamiento array:', equipamientoArray);
      console.log('Form values:', formValues);

      const request = {
        servicioId: formValues.servicioId,
        clienteId: user.id,
        fecha: formValues.fecha,
        horaInicio: formValues.horaInicio,
        duracionBloques: formValues.cantidadBloques, // Mapear cantidadBloques a duracionBloques
        equipamiento: equipamientoArray,
        observaciones: formValues.observaciones
      };

      console.log('Request completo:', request);

      this.reservaService.reservarServicio(request).subscribe({
        next: (response) => {
          if (response.success) {
            Swal.fire({
              title: '¡Reserva creada!',
              html: `
                <p>Su reserva ha sido creada exitosamente.</p>
                <p><strong>ID:</strong> #${response.data.id}</p>
                <p><strong>Estado:</strong> PENDIENTE</p>
                <p class="text-muted">Puede ver sus reservas en "Mis Reservas"</p>
              `,
              icon: 'success',
              confirmButtonText: 'Ver Mis Reservas'
            }).then(() => {
              this.router.navigate(['/cliente/mis-reservas']);
            });
          }
        },
        error: (error) => {
          console.error('Error:', error);
          const mensaje = error.error?.message || 'No se pudo crear la reserva';
          Swal.fire('Error', mensaje, 'error');
          this.cargando = false;
        }
      });
    }
  }

  volver(): void {
    if (this.paso > 1) {
      this.paso--;
    } else {
      this.router.navigate(['/cliente/mis-reservas']);
    }
  }

  reiniciar(): void {
    this.paso = 1;
    this.tipoReserva = null;
    this.disponible = false;
    this.formCabana.reset();
    this.formServicio.reset();
  }

  getNombreCabana(id: number): string {
    const cabana = this.cabanas.find(c => c.id === id);
    return cabana?.nombre || '';
  }

  getNombreServicio(id: number): string {
    const servicio = this.servicios.find(s => s.id === id);
    return servicio?.nombre || '';
  }

  // Métodos de navegación adicionales para el wizard
  volverPaso1(): void {
    this.paso = 1;
    this.tipoReserva = null;
  }

  volverPaso2(): void {
    this.paso = 2;
  }

  /**
   * Callback del calendario cuando se selecciona un rango de fechas
   */
  onRangoSeleccionado(rango: { inicio: Date, fin: Date }): void {
    // Formatear las fechas a YYYY-MM-DD para el formulario
    const fechaInicioStr = this.formatearFechaParaFormulario(rango.inicio);
    const fechaFinStr = this.formatearFechaParaFormulario(rango.fin);

    // Actualizar el formulario
    this.formCabana.patchValue({
      fechaInicio: fechaInicioStr,
      fechaFin: fechaFinStr
    });

    // Marcar como touched para que se valide
    this.formCabana.get('fechaInicio')?.markAsTouched();
    this.formCabana.get('fechaFin')?.markAsTouched();
  }

  /**
   * Formatear fecha a string YYYY-MM-DD
   */
  private formatearFechaParaFormulario(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Métodos para obtener objetos completos (usados en el resumen)
  getCabanaSeleccionada(): Cabana | undefined {
    const cabanaId = this.formCabana.get('cabanaId')?.value;
    return this.cabanas.find(c => c.id === Number(cabanaId));
  }

  getServicioSeleccionado(): ServicioEntretencion | undefined {
    const servicioId = this.formServicio.get('servicioId')?.value;
    return this.servicios.find(s => s.id === Number(servicioId));
  }

  // Variable adicional para loading de creación
  creandoReserva = false;

  /**
   * Cargar items del inventario según el recurso seleccionado
   */
  cargarItemsInventario(recursoId: number): void {
    this.cargandoItems = true;
    this.inventarioService.obtenerPorRecurso(recursoId).subscribe({
      next: (items) => {
        // Solo items reservables y en buen estado (NUEVO o BUENO)
        this.itemsDisponibles = items.filter(
          item => item.esReservable && (item.estadoItem === EstadoItem.NUEVO || item.estadoItem === EstadoItem.BUENO)
        );
        this.cargandoItems = false;
      },
      error: (error) => {
        console.error('Error al cargar items:', error);
        this.cargandoItems = false;
        // No mostrar error al usuario, simplemente no habrá items disponibles
      }
    });
  }

  /**
   * Agregar o quitar item de la selección
   */
  toggleItem(item: ItemInventario): void {
    if (this.itemsSeleccionados.has(item.id)) {
      this.itemsSeleccionados.delete(item.id);
    } else {
      this.itemsSeleccionados.set(item.id, { item, cantidad: 1 });
    }
  }

  /**
   * Verificar si un item está seleccionado
   */
  isItemSeleccionado(itemId: number): boolean {
    return this.itemsSeleccionados.has(itemId);
  }

  /**
   * Actualizar cantidad de un item
   */
  actualizarCantidadItem(itemId: number, cantidad: number): void {
    const seleccion = this.itemsSeleccionados.get(itemId);
    if (seleccion && cantidad > 0 && cantidad <= seleccion.item.cantidadTotal) {
      seleccion.cantidad = cantidad;
    }
  }

  /**
   * Obtener cantidad de un item seleccionado
   */
  getCantidadItem(itemId: number): number {
    return this.itemsSeleccionados.get(itemId)?.cantidad || 1;
  }

  /**
   * Calcular precio total de items seleccionados
   */
  get precioTotalItems(): number {
    let total = 0;
    this.itemsSeleccionados.forEach(seleccion => {
      total += seleccion.item.precioReserva * seleccion.cantidad;
    });
    return total;
  }

  /**
   * Obtener array de items seleccionados para enviar al backend
   */
  getItemsParaReserva(): any[] {
    const items: any[] = [];
    this.itemsSeleccionados.forEach(seleccion => {
      items.push({
        itemId: seleccion.item.id,
        cantidad: seleccion.cantidad
      });
    });
    return items;
  }

  /**
   * Formatear precio
   */
  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(precio);
  }

  /**
   * Obtener icono según categoría de item
   */
  getIconoCategoria(categoria: string): string {
    switch (categoria) {
      case 'ROPA_CAMA':
        return 'fa-bed';
      case 'EQUIPAMIENTO_DEPORTIVO':
        return 'fa-bicycle';
      case 'ELECTRODOMESTICOS':
        return 'fa-plug';
      case 'MENAJE':
        return 'fa-utensils';
      case 'DECORACION':
        return 'fa-paint-brush';
      case 'HERRAMIENTAS':
        return 'fa-tools';
      default:
        return 'fa-box';
    }
  }

  /**
   * Cargar bloques disponibles cuando se selecciona fecha y servicio
   */
  cargarBloquesDisponibles(): void {
    const servicioId = this.formServicio.get('servicioId')?.value;
    const fecha = this.formServicio.get('fecha')?.value;

    if (!servicioId || !fecha) return;

    this.cargandoBloques = true;
    this.bloqueSeleccionado = undefined; // Resetear selección
    this.formServicio.patchValue({ horaInicio: '' }); // Limpiar hora

    this.bloqueService.obtenerBloquesPorFecha(servicioId, fecha).subscribe({
      next: (bloques) => {
        // Filtrar solo bloques disponibles y que no hayan pasado
        const ahora = new Date();
        const fechaSeleccionada = new Date(fecha + 'T00:00:00');

        this.bloquesDisponibles = bloques.filter(b => {
          if (!b.disponible) return false;

          // Si la fecha es hoy, verificar que la hora no haya pasado
          if (fechaSeleccionada.toDateString() === ahora.toDateString()) {
            const [horas, minutos] = b.horaInicio.split(':').map(Number);
            const horaBloque = new Date(ahora);
            horaBloque.setHours(horas, minutos, 0, 0);
            return horaBloque > ahora;
          }

          // Si es una fecha futura, mostrar todos los bloques disponibles
          return true;
        });

        this.cargandoBloques = false;
      },
      error: (error) => {
        console.error('Error al cargar bloques:', error);
        this.cargandoBloques = false;
        this.bloquesDisponibles = [];
      }
    });
  }

  /**
   * Seleccionar un bloque horario
   */
  seleccionarBloque(bloque: BloqueHorario): void {
    this.bloqueSeleccionado = bloque;
    // Actualizar el formulario con la hora del bloque seleccionado
    this.formServicio.patchValue({
      horaInicio: bloque.horaInicio
    });
  }

  /**
   * Verificar si un bloque está seleccionado
   */
  isBloqueSeleccionado(bloqueId?: number): boolean {
    return this.bloqueSeleccionado?.id === bloqueId;
  }
}
