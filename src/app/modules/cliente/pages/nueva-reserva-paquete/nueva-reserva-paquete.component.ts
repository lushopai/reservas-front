import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CabanaService } from '../../../../core/services/cabana.service';
import { ServicioEntretencionService } from '../../../../core/services/servicio-entretencion.service';
import { PaqueteService, ServicioReservaDTO } from '../../../../core/services/paquete.service';
import { InventarioService } from '../../../../core/services/inventario.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Cabana } from '../../../../core/models/cabana.model';
import { ServicioEntretencion } from '../../../../core/models/servicio.model';
import { ItemInventario } from '../../../../core/models/inventario.model';

@Component({
  selector: 'app-nueva-reserva-paquete',
  templateUrl: './nueva-reserva-paquete.component.html',
  styleUrls: ['./nueva-reserva-paquete.component.scss']
})
export class NuevaReservaPaqueteComponent implements OnInit {
  paso: number = 1;

  // Datos
  cabanas: Cabana[] = [];
  serviciosDisponibles: ServicioEntretencion[] = [];
  itemsDisponibles: ItemInventario[] = [];

  // Formularios
  formPaquete!: FormGroup;
  serviciosSeleccionados: ServicioReservaDTO[] = [];

  // Items seleccionados para cabaña
  itemsCabanaSeleccionados: Map<number, { item: ItemInventario, cantidad: number }> = new Map();

  cargando = false;
  cargandoItems = false;

  // Fecha mínima (hoy)
  get fechaMinima(): string {
    return new Date().toISOString().split('T')[0];
  }

  constructor(
    private fb: FormBuilder,
    private cabanaService: CabanaService,
    private servicioService: ServicioEntretencionService,
    public paqueteService: PaqueteService,
    private inventarioService: InventarioService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarDatos();
  }

  inicializarFormulario(): void {
    this.formPaquete = this.fb.group({
      nombrePaquete: ['Mi Paquete de Vacaciones', Validators.required],
      cabanaId: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      notasEspeciales: ['']
    });
  }

  cargarDatos(): void {
    this.cargando = true;

    // Cargar cabañas y servicios en paralelo
    Promise.all([
      this.cabanaService.obtenerTodas().toPromise(),
      this.servicioService.obtenerTodos().toPromise()
    ]).then(([cabanas, servicios]) => {
      this.cabanas = cabanas?.filter(c => c.estado === 'DISPONIBLE') || [];
      this.serviciosDisponibles = servicios?.filter(s => s.estado === 'DISPONIBLE') || [];
      this.cargando = false;
    }).catch(error => {
      console.error('Error al cargar datos:', error);
      Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
      this.cargando = false;
    });
  }

  /**
   * Cargar items de la cabaña seleccionada
   */
  onCabanaSeleccionada(): void {
    const cabanaId = this.formPaquete.get('cabanaId')?.value;
    if (cabanaId) {
      this.cargarItemsCabana(cabanaId);
    }
  }

  /**
   * Manejar selección de fechas desde el calendario
   */
  onRangoFechasSeleccionado(rango: { inicio: Date, fin: Date }): void {
    const fechaInicio = this.formatearFechaISO(rango.inicio);
    const fechaFin = this.formatearFechaISO(rango.fin);

    this.formPaquete.patchValue({
      fechaInicio,
      fechaFin
    });

    console.log('Fechas seleccionadas:', { fechaInicio, fechaFin });
  }

  /**
   * Formatear fecha a formato ISO (YYYY-MM-DD)
   */
  formatearFechaISO(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  cargarItemsCabana(recursoId: number): void {
    this.cargandoItems = true;
    this.inventarioService.obtenerPorRecurso(recursoId).subscribe({
      next: (items) => {
        this.itemsDisponibles = items.filter(
          item => item.esReservable && item.estadoItem === 'DISPONIBLE'
        );
        this.cargandoItems = false;
      },
      error: (error) => {
        console.error('Error al cargar items:', error);
        this.cargandoItems = false;
      }
    });
  }

  /**
   * Agregar servicio al paquete
   */
  agregarServicio(): void {
    const fechaInicio = this.formPaquete.get('fechaInicio')?.value;
    const fechaFin = this.formPaquete.get('fechaFin')?.value;

    if (!fechaInicio || !fechaFin) {
      Swal.fire('Atención', 'Primero selecciona las fechas de la cabaña', 'warning');
      return;
    }

    Swal.fire({
      title: 'Agregar Servicio',
      html: `
        <div class="text-start">
          <div class="mb-3">
            <label class="form-label">Servicio</label>
            <select id="swal-servicio" class="form-select">
              <option value="">Seleccione un servicio</option>
              ${this.serviciosDisponibles.map(s =>
                `<option value="${s.id}">${s.nombre} - $${s.precioPorUnidad}/bloque</option>`
              ).join('')}
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Fecha</label>
            <input type="date" id="swal-fecha" class="form-control" min="${fechaInicio}" max="${fechaFin}">
          </div>
          <div class="mb-3">
            <label class="form-label">Hora de inicio</label>
            <input type="time" id="swal-hora" class="form-control" value="09:00">
          </div>
          <div class="mb-3">
            <label class="form-label">Cantidad de bloques</label>
            <input type="number" id="swal-bloques" class="form-control" value="1" min="1" max="8">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const servicioId = (document.getElementById('swal-servicio') as HTMLSelectElement).value;
        const fecha = (document.getElementById('swal-fecha') as HTMLInputElement).value;
        const horaInicio = (document.getElementById('swal-hora') as HTMLInputElement).value;
        const duracionBloques = parseInt((document.getElementById('swal-bloques') as HTMLInputElement).value);

        if (!servicioId || !fecha || !horaInicio) {
          Swal.showValidationMessage('Todos los campos son requeridos');
          return null;
        }

        return {
          servicioId: parseInt(servicioId),
          fecha,
          horaInicio,
          duracionBloques
        };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.serviciosSeleccionados.push(result.value);
        Swal.fire('Agregado', 'Servicio agregado al paquete', 'success');
      }
    });
  }

  /**
   * Eliminar servicio del paquete
   */
  eliminarServicio(index: number): void {
    Swal.fire({
      title: '¿Eliminar servicio?',
      text: '¿Estás seguro de quitar este servicio del paquete?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.serviciosSeleccionados.splice(index, 1);
      }
    });
  }

  /**
   * Items de cabaña
   */
  toggleItemCabana(item: ItemInventario): void {
    if (this.itemsCabanaSeleccionados.has(item.id)) {
      this.itemsCabanaSeleccionados.delete(item.id);
    } else {
      this.itemsCabanaSeleccionados.set(item.id, { item, cantidad: 1 });
    }
  }

  isItemCabanaSeleccionado(itemId: number): boolean {
    return this.itemsCabanaSeleccionados.has(itemId);
  }

  actualizarCantidadItemCabana(itemId: number, cantidad: number): void {
    const seleccion = this.itemsCabanaSeleccionados.get(itemId);
    if (seleccion && cantidad > 0 && cantidad <= seleccion.item.cantidadTotal) {
      seleccion.cantidad = cantidad;
    }
  }

  getCantidadItemCabana(itemId: number): number {
    return this.itemsCabanaSeleccionados.get(itemId)?.cantidad || 1;
  }

  get precioTotalItemsCabana(): number {
    let total = 0;
    this.itemsCabanaSeleccionados.forEach(seleccion => {
      total += seleccion.item.precioReserva * seleccion.cantidad;
    });
    return total;
  }

  /**
   * Obtener nombre del servicio
   */
  getNombreServicio(servicioId: number): string {
    return this.serviciosDisponibles.find(s => s.id === servicioId)?.nombre || 'Servicio';
  }

  /**
   * Avanzar al resumen
   */
  irAResumen(): void {
    if (this.formPaquete.invalid) {
      this.formPaquete.markAllAsTouched();
      Swal.fire('Error', 'Complete todos los campos requeridos', 'error');
      return;
    }

    if (this.serviciosSeleccionados.length === 0) {
      Swal.fire('Atención', 'Debe agregar al menos un servicio al paquete', 'warning');
      return;
    }

    this.paso = 2;
  }

  /**
   * Confirmar paquete
   */
  confirmarPaquete(): void {
    const user = this.authService.getCurrentUser();
    if (!user || !user.id) {
      Swal.fire('Error', 'Debe iniciar sesión', 'error');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.cargando = true;

    const itemsArray: any[] = [];
    this.itemsCabanaSeleccionados.forEach(seleccion => {
      itemsArray.push({
        itemId: seleccion.item.id,
        cantidad: seleccion.cantidad
      });
    });

    const request = {
      clienteId: user.id,
      nombre: this.formPaquete.get('nombrePaquete')?.value, // El backend espera 'nombre', no 'nombrePaquete'
      fechaInicio: this.formPaquete.get('fechaInicio')?.value,
      fechaFin: this.formPaquete.get('fechaFin')?.value,
      cabanaId: this.formPaquete.get('cabanaId')?.value,
      itemsCabana: itemsArray, // Cambiar a itemsCabana para coincidir con el backend
      servicios: this.serviciosSeleccionados,
      notasEspeciales: this.formPaquete.get('notasEspeciales')?.value
    };

    this.paqueteService.crearPaquete(request).subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire({
            title: '¡Paquete creado!',
            html: `
              <p>Tu paquete ha sido creado exitosamente.</p>
              <p><strong>ID:</strong> #${response.data.id}</p>
              <p><strong>Precio Final:</strong> ${this.formatearPrecio(response.data.precioFinal)}</p>
              <p><strong>Estado:</strong> PENDIENTE</p>
              <p class="text-muted small">Puedes pagar desde "Mis Reservas"</p>
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
        const mensaje = error.error?.message || 'No se pudo crear el paquete';
        Swal.fire('Error', mensaje, 'error');
        this.cargando = false;
      }
    });
  }

  volver(): void {
    if (this.paso > 1) {
      this.paso--;
    } else {
      this.router.navigate(['/cliente/mis-reservas']);
    }
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(precio);
  }

  getIconoCategoria(categoria: string): string {
    switch (categoria) {
      case 'ROPA_CAMA': return 'fa-bed';
      case 'EQUIPAMIENTO_DEPORTIVO': return 'fa-bicycle';
      case 'ELECTRODOMESTICOS': return 'fa-plug';
      case 'MENAJE': return 'fa-utensils';
      default: return 'fa-box';
    }
  }

  getCabanaSeleccionada(): Cabana | undefined {
    const cabanaId = this.formPaquete.get('cabanaId')?.value;
    return this.cabanas.find(c => c.id === Number(cabanaId));
  }
}
