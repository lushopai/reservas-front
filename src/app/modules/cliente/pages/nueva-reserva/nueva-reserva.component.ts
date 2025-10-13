import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CabanaService } from '../../../../core/services/cabana.service';
import { ServicioEntretencionService } from '../../../../core/services/servicio-entretencion.service';
import { ReservaService } from '../../../../core/services/reserva.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DisponibilidadService } from '../../../../core/services/disponibilidad.service';
import { Cabana } from '../../../../core/models/cabana.model';
import { ServicioEntretencion } from '../../../../core/models/servicio.model';

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

  // Formularios
  formCabana!: FormGroup;
  formServicio!: FormGroup;

  cargando = false;
  verificandoDisponibilidad = false;
  disponible = false;

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
    private authService: AuthService,
    private router: Router
  ) {}

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
      horaInicio: ['', Validators.required],
      cantidadBloques: [1, [Validators.required, Validators.min(1), Validators.max(8)]],
      cantidadPersonas: [1, [Validators.required, Validators.min(1)]],
      observaciones: ['']
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
    }
  }

  confirmarReserva(): void {
    const user = this.authService.getCurrentUser();
    if (!user || !user.id) {
      Swal.fire('Error', 'Debe iniciar sesión', 'error');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.cargando = true;

    if (this.tipoReserva === 'cabana') {
      const request = {
        ...this.formCabana.value,
        clienteId: user.id
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
      const request = {
        ...this.formServicio.value,
        clienteId: user.id
      };

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
}
