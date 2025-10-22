import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReservaService } from '../../../../core/services/reserva.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CabanaService } from '../../../../core/services/cabana.service';
import { PaqueteService, PaqueteReservaRequest, ServicioReservaDTO } from '../../../../core/services/paquete.service';
import { ItemInventario } from '../../../../core/models/inventario.model';
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
    private paqueteService: PaqueteService
  ) {}

  ngOnInit(): void {
    // Recuperar datos de la reserva desde sessionStorage
    const data = sessionStorage.getItem('reserva_pendiente');
    if (!data) {
      Swal.fire('Error', 'No hay datos de reserva', 'error')
        .then(() => this.router.navigate(['/cabanas']));
      return;
    }

    this.reservaData = JSON.parse(data);

    // Si es una cabaña o paquete, cargar items adicionales disponibles
    if ((this.reservaData.tipo === 'cabana' || this.reservaData.tipo === 'paquete') && this.reservaData.cabanaId) {
      this.cargarItemsAdicionales(this.reservaData.cabanaId);
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
    let total = this.reservaData.precioCalculado || 0;

    // Sumar precio de items adicionales
    this.itemsSeleccionados.forEach((cantidad, itemId) => {
      const item = this.itemsDisponibles.find(i => i.id === itemId);
      if (item && item.precioReserva) {
        total += item.precioReserva * cantidad;
      }
    });

    return total;
  }

  confirmarReserva(): void {
    const user = this.authService.getCurrentUser();
    if (!user || !user.id) {
      Swal.fire('Error', 'Debe iniciar sesión', 'error');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.cargando = true;

    // Si es paquete (cabaña + servicios)
    if (this.reservaData.tipo === 'paquete') {
      // Preparar items adicionales para el request
      const itemsAdicionales = Array.from(this.itemsSeleccionados.entries()).map(([itemId, cantidad]) => ({
        itemId: itemId,
        cantidad: cantidad
      }));

      // Preparar servicios
      const servicios: ServicioReservaDTO[] = this.reservaData.servicios || [];

      const request: PaqueteReservaRequest = {
        clienteId: user.id,
        nombre: `Paquete ${this.reservaData.cabana?.nombre || 'Reserva'}`,
        fechaInicio: this.reservaData.fechaInicio,
        fechaFin: this.reservaData.fechaFin,
        cabanaId: this.reservaData.cabanaId,
        itemsCabana: itemsAdicionales.length > 0 ? itemsAdicionales : undefined,
        servicios: servicios,
        notasEspeciales: this.observaciones
      };

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
}
