import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReservaService } from '../../../../core/services/reserva.service';
import { AuthService } from '../../../../core/services/auth.service';
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

  constructor(
    private router: Router,
    private reservaService: ReservaService,
    private authService: AuthService
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
  }

  confirmarReserva(): void {
    const user = this.authService.getCurrentUser();
    if (!user || !user.id) {
      Swal.fire('Error', 'Debe iniciar sesión', 'error');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.cargando = true;

    if (this.reservaData.tipo === 'cabana') {
      const request = {
        cabanaId: this.reservaData.cabanaId,
        clienteId: user.id,
        fechaInicio: this.reservaData.fechaInicio,
        fechaFin: this.reservaData.fechaFin,
        observaciones: this.observaciones,
        itemsAdicionales: []
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
        if (this.reservaData.tipo === 'cabana') {
          this.router.navigate(['/cabanas', this.reservaData.cabanaId]);
        } else {
          this.router.navigate(['/servicios', this.reservaData.servicioId]);
        }
      }
    });
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CL').format(precio);
  }
}
