import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReservaService } from '../../../../core/services/reserva.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CabanaService } from '../../../../core/services/cabana.service';
import { PaqueteService, PaqueteReservaRequest, ServicioReservaDTO } from '../../../../core/services/paquete.service';
import { ItemInventario } from '../../../../core/models/inventario.model';
import { InventarioService } from '../../../../core/services/inventario.service';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-confirmar-reserva',
  templateUrl: './confirmar-reserva.component.html',
  styleUrls: ['./confirmar-reserva.component.scss']
})
export class ConfirmarReservaComponent implements OnInit {
  reservaData: any = null;
  cargando = false;
  observaciones: string = '';

  // Items adicionales
  itemsDisponibles: ItemInventario[] = [];
  itemsSeleccionados: Map<number, number> = new Map(); // itemId -> cantidad
  cargandoItems = false;

  constructor(
    private router: Router,
    private reservaService: ReservaService,
    private authService: AuthService,
    private cabanaService: CabanaService,
    private paqueteService: PaqueteService,
    private inventarioService: InventarioService
  ) { }

  ngOnInit(): void {
    // Recuperar datos de la reserva desde sessionStorage
    const data = sessionStorage.getItem('reserva_pendiente');
    if (!data) {
      Swal.fire('Error', 'No hay datos de reserva', 'error')
        .then(() => this.router.navigate(['/cabanas']));
      return;
    }

    this.reservaData = JSON.parse(data);
    console.log('reservaData loaded:', this.reservaData);
    console.log('precioCalculado:', this.reservaData.precioCalculado);
    console.log('precioTotal:', this.reservaData.precioTotal);
    console.log('tipo:', this.reservaData.tipo);


    // Cargar items adicionales según el tipo
    if (this.reservaData.tipo === 'cabana' && this.reservaData.cabanaId) {
      this.cargarItemsAdicionales(this.reservaData.cabanaId);
    } else if (this.reservaData.tipo === 'paquete') {
      // Para paquetes, cargar items de cabaña y servicios
      this.cargarItemsPaquete();
    } else if (this.reservaData.tipo === 'servicio' && this.reservaData.servicioId) {
      this.cargarItemsServicio(this.reservaData.servicioId);
    }
  }

  cargarItemsAdicionales(cabanaId: number): void {
    this.cargandoItems = true;
    this.cabanaService.obtenerItemsAdicionales(cabanaId).subscribe({
      next: (items) => {
        this.itemsDisponibles = items;
        this.cargandoItems = false;
        console.log('Items adicionales cargados:', items.length);
      },
      error: (error) => {
        console.error('Error al cargar items adicionales:', error);
        this.cargandoItems = false;
        // No mostrar error al usuario, simplemente no mostrar items
      }
    });
  }

  cargarItemsServicio(servicioId: number): void {
    this.cargandoItems = true;
    this.inventarioService.obtenerPorRecurso(servicioId).subscribe({
      next: (items) => {
        // Solo items reservables
        this.itemsDisponibles = items.filter(item => item.esReservable);
        this.cargandoItems = false;
        console.log('Items de servicio cargados:', this.itemsDisponibles.length);
      },
      error: (error) => {
        console.error('Error al cargar items de servicio:', error);
        this.cargandoItems = false;
      }
    });
  }

  cargarItemsPaquete(): void {
    this.cargandoItems = true;
    const observables: any[] = [];
    const recursosIds: number[] = []; // IDs de recursos del paquete

    // Cargar items de la cabaña si existe
    if (this.reservaData.cabanaId) {
      observables.push(this.cabanaService.obtenerItemsAdicionales(this.reservaData.cabanaId));
      recursosIds.push(this.reservaData.cabanaId);
    }

    // Cargar items de cada servicio
    if (this.reservaData.servicios && this.reservaData.servicios.length > 0) {
      this.reservaData.servicios.forEach((servicio: any) => {
        if (servicio.servicioId) {
          observables.push(this.inventarioService.obtenerPorRecurso(servicio.servicioId));
          recursosIds.push(servicio.servicioId);
        }
      });
    }

    if (observables.length === 0) {
      this.cargandoItems = false;
      return;
    }

    forkJoin(observables).subscribe({
      next: (resultados: ItemInventario[][]) => {
        // Combinar todos los items y eliminar duplicados
        const todosLosItems = resultados.flat();
        const itemsUnicos = new Map<number, ItemInventario>();

        todosLosItems.forEach(item => {
          // ✅ VALIDACIÓN CRÍTICA: Solo agregar items que pertenezcan a los recursos del paquete
          if (item.esReservable &&
            item.recursoId &&
            recursosIds.includes(item.recursoId) &&
            !itemsUnicos.has(item.id)) {
            itemsUnicos.set(item.id, item);
          }
        });

        this.itemsDisponibles = Array.from(itemsUnicos.values());
        this.cargandoItems = false;
        console.log('Items de paquete cargados:', this.itemsDisponibles.length, 'de recursos:', recursosIds);
      },
      error: (error) => {
        console.error('Error al cargar items del paquete:', error);
        this.cargandoItems = false;
      }
    });
  }

  toggleItem(itemId: number, cantidad: number): void {
    if (cantidad > 0) {
      this.itemsSeleccionados.set(itemId, cantidad);
    } else {
      this.itemsSeleccionados.delete(itemId);
    }
    this.calcularPrecioTotal();
  }

  getCantidadSeleccionada(itemId: number): number {
    return this.itemsSeleccionados.get(itemId) || 0;
  }

  calcularPrecioTotal(): number {
    // Para paquetes, usar precioTotal que ya incluye cabaña + servicios
    // Para cabana/servicio simple, usar precioCalculado
    let total = this.reservaData.tipo === 'paquete'
      ? (this.reservaData.precioTotal || 0)
      : (this.reservaData.precioCalculado || 0);

    console.log('Base total:', total, 'tipo:', this.reservaData.tipo);

    // Sumar precio de items adicionales
    this.itemsSeleccionados.forEach((cantidad, itemId) => {
      const item = this.itemsDisponibles.find(i => i.id === itemId);
      if (item && item.precioReserva) {
        console.log(`Adding item: ${item.nombre}, precio: ${item.precioReserva}, cantidad: ${cantidad}, subtotal: ${item.precioReserva * cantidad}`);
        total += item.precioReserva * cantidad;
      }
    });

    console.log('Total final calculado:', total);
    return total;
  }

  confirmarReserva(): void {
    console.log('🔵 confirmarReserva() llamado');
    console.log('reservaData.tipo:', this.reservaData?.tipo);

    const user = this.authService.getCurrentUser();
    if (!user || !user.id) {
      Swal.fire('Error', 'Debe iniciar sesión', 'error');
      this.router.navigate(['/auth/login']);
      return;
    }

    console.log('✅ Usuario autenticado, ID:', user.id);
    this.cargando = true;

    // Si es paquete (cabaña + servicios)
    if (this.reservaData.tipo === 'paquete') {
      console.log('📦 Procesando como PAQUETE');
      // ✅ Separar items por recurso
      const itemsCabana: any[] = [];
      const itemsPorServicio = new Map<number, any[]>(); // servicioId -> items

      // Clasificar cada item seleccionado según su recurso
      this.itemsSeleccionados.forEach((cantidad, itemId) => {
        const item = this.itemsDisponibles.find(i => i.id === itemId);
        if (item && item.recursoId) {
          const itemDto = { itemId: itemId, cantidad: cantidad };

          if (item.recursoId === this.reservaData.cabanaId) {
            // Item pertenece a la cabaña
            itemsCabana.push(itemDto);
          } else {
            // Item pertenece a un servicio
            if (!itemsPorServicio.has(item.recursoId)) {
              itemsPorServicio.set(item.recursoId, []);
            }
            itemsPorServicio.get(item.recursoId)!.push(itemDto);
          }
        }
      });

      // Preparar servicios con sus items correspondientes
      const servicios = (this.reservaData.servicios || []).map((servicio: any) => {
        const servicioDto: any = {
          servicioId: servicio.servicioId,
          fecha: servicio.fecha,
          horaInicio: servicio.horaInicio,
          duracionBloques: servicio.duracionBloques
        };

        // Agregar items adicionales si existen para este servicio
        const itemsDelServicio = itemsPorServicio.get(servicio.servicioId);
        if (itemsDelServicio && itemsDelServicio.length > 0) {
          servicioDto.itemsAdicionales = itemsDelServicio;
        }

        return servicioDto;
      });

      const request: PaqueteReservaRequest = {
        clienteId: user.id,
        nombre: `Paquete ${this.reservaData.cabana?.nombre || 'Reserva'}`,
        fechaInicio: this.reservaData.fechaInicio,
        fechaFin: this.reservaData.fechaFin,
        cabanaId: this.reservaData.cabanaId,
        itemsAdicionales: itemsCabana.length > 0 ? itemsCabana : undefined,
        servicios: servicios,
        notasEspeciales: this.observaciones
      };

      console.log('=== ENVIANDO REQUEST AL BACKEND ===');
      console.log('Items seleccionados (Map):', this.itemsSeleccionados);
      console.log('Items de cabaña:', itemsCabana);
      console.log('Items por servicio:', itemsPorServicio);
      console.log('Servicios en request:', request.servicios);
      console.log('Request completo:', JSON.stringify(request, null, 2));
      console.log('===================================');

      // Mostrar alerta con detalles del request
      alert(`REQUEST AL BACKEND:\n\nItems de cabaña: ${itemsCabana.length}\nServicios: ${request.servicios?.length || 0}\n\nRevisa la consola para más detalles`);

      this.paqueteService.crearPaquete(request).subscribe({
        next: (response) => {
          if (response.success) {
            // Limpiar sessionStorage
            sessionStorage.removeItem('reserva_pendiente');

            Swal.fire({
              title: '¡Paquete creado!',
              html: `
            <p>Su paquete de reserva ha sido creado exitosamente.</p>
            <p><strong>ID:</strong> #${response.data.id}</p>
                <p><strong>Estado:</strong> ${response.data.estado}</p>
                <p><strong>Total:</strong> ${this.formatearPrecio(response.data.precioFinal)}</p>
                <p class="text-muted mt-2">Puede ver sus reservas en "Mis Reservas"</p>
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
    } else if (this.reservaData.tipo === 'cabana') {
      // Preparar items adicionales para el request
      const itemsAdicionales = Array.from(this.itemsSeleccionados.entries()).map(([itemId, cantidad]) => ({
        itemId: itemId,
        cantidad: cantidad
      }));

      const request = {
        cabanaId: this.reservaData.cabanaId,
        clienteId: user.id,
        fechaInicio: this.reservaData.fechaInicio,
        fechaFin: this.reservaData.fechaFin,
        observaciones: this.observaciones,
        itemsAdicionales: itemsAdicionales
      };

      this.reservaService.reservarCabana(request).subscribe({
        next: (response) => {
          if (response.success) {
            // Limpiar sessionStorage
            sessionStorage.removeItem('reserva_pendiente');

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
    } else if (this.reservaData.tipo === 'servicio') {
      const request = {
        servicioId: this.reservaData.servicioId,
        clienteId: user.id,
        fecha: this.reservaData.fecha,
        horaInicio: this.reservaData.horaInicio,
        duracionBloques: this.reservaData.cantidadBloques,
        equipamiento: [],
        observaciones: this.observaciones
      };

      this.reservaService.reservarServicio(request).subscribe({
        next: (response) => {
          if (response.success) {
            // Limpiar sessionStorage
            sessionStorage.removeItem('reserva_pendiente');

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

  cancelar(): void {
    Swal.fire({
      title: '¿Cancelar reserva?',
      text: 'Se perderán los datos de la reserva',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, continuar'
    }).then((result) => {
      if (result.isConfirmed) {
        sessionStorage.removeItem('reserva_pendiente');
        if (this.reservaData.tipo === 'cabana' || this.reservaData.tipo === 'paquete') {
          this.router.navigate(['/cabanas', this.reservaData.cabanaId]);
        } else if (this.reservaData.tipo === 'servicio') {
          this.router.navigate(['/servicios', this.reservaData.servicioId]);
        } else {
          // Fallback a una página genérica si el tipo no es esperado
          this.router.navigate(['/']);
        }
      }
    });
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CL').format(precio);
  }

  /**
     * Calcula la hora de fin sumando la duración en bloques a la hora de inicio
   * Asumiendo que cada bloque = 1 hora
   */
  calcularHoraFin(horaInicio: string, duracionBloques: number): string {
    if (!horaInicio) return '';

    // Parse hora inicio (formato "HH:mm")
    const [horas, minutos] = horaInicio.split(':').map(Number);

    // Crear fecha auxiliar para cálculos
    const fecha = new Date();
    fecha.setHours(horas, minutos, 0, 0);

    // Sumar duración (bloques de 1 hora)
    fecha.setHours(fecha.getHours() + duracionBloques);

    // Formatear como HH:mm
    const horaFin = fecha.getHours().toString().padStart(2, '0');
    const minutosFin = fecha.getMinutes().toString().padStart(2, '0');

    return `${horaFin}:${minutosFin}`;
  }
} 
