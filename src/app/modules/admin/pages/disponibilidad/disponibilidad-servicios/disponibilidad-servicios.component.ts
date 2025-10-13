import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { ServicioEntretencionService } from '../../../../../core/services/servicio-entretencion.service';
import { DisponibilidadService } from '../../../../../core/services/disponibilidad.service';
import { ServicioEntretencion } from '../../../../../core/models/servicio.model';
import { BloqueHorario } from '../../../../../core/models/disponibilidad.model';

@Component({
  selector: 'app-disponibilidad-servicios',
  templateUrl: './disponibilidad-servicios.component.html',
  styleUrls: ['./disponibilidad-servicios.component.scss']
})
export class DisponibilidadServiciosComponent implements OnInit {
  servicios: ServicioEntretencion[] = [];
  servicioSeleccionado?: ServicioEntretencion;

  fechaSeleccionada: string = '';
  bloquesHorarios: BloqueHorario[] = [];

  formGenerarBloques!: FormGroup;
  formBloquearBloque!: FormGroup;
  mostrarFormGenerar = false;
  mostrarFormBloquear = false;
  cargando = false;

  constructor(
    private servicioService: ServicioEntretencionService,
    private disponibilidadService: DisponibilidadService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.inicializarFormularios();
    this.cargarServicios();
    this.fechaSeleccionada = this.obtenerFechaHoy();
  }

  inicializarFormularios(): void {
    this.formGenerarBloques = this.fb.group({
      fecha: ['', Validators.required],
      horaApertura: ['08:00', Validators.required],
      horaCierre: ['20:00', Validators.required],
      duracionBloqueMinutos: [60, [Validators.required, Validators.min(15)]]
    });

    this.formBloquearBloque = this.fb.group({
      fecha: ['', Validators.required],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required],
      motivo: ['MANTENIMIENTO']
    });
  }

  cargarServicios(): void {
    this.servicioService.obtenerTodos().subscribe({
      next: (data) => {
        this.servicios = data.filter(s => s.id !== undefined);
        if (this.servicios.length > 0) {
          this.seleccionarServicio(this.servicios[0]);
        }
      },
      error: (error) => {
        console.error('Error al cargar servicios:', error);
        Swal.fire('Error', 'No se pudieron cargar los servicios', 'error');
      }
    });
  }

  seleccionarServicio(servicio: ServicioEntretencion): void {
    this.servicioSeleccionado = servicio;
    this.cargarBloques();
  }

  cargarBloques(): void {
    if (!this.servicioSeleccionado?.id || !this.fechaSeleccionada) return;

    this.cargando = true;
    this.disponibilidadService.obtenerBloquesDisponibles(
      this.servicioSeleccionado.id,
      this.fechaSeleccionada
    ).subscribe({
      next: (bloques) => {
        this.bloquesHorarios = bloques;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar bloques:', error);
        this.bloquesHorarios = [];
        this.cargando = false;
      }
    });
  }

  cambiarFecha(): void {
    this.cargarBloques();
  }

  abrirFormGenerar(): void {
    this.mostrarFormGenerar = true;
    this.formGenerarBloques.patchValue({
      fecha: this.fechaSeleccionada,
      horaApertura: '08:00',
      horaCierre: '20:00',
      duracionBloqueMinutos: this.servicioSeleccionado?.duracionBloqueMinutos || 60
    });
  }

  cerrarFormGenerar(): void {
    this.mostrarFormGenerar = false;
  }

  generarBloques(): void {
    if (this.formGenerarBloques.invalid || !this.servicioSeleccionado?.id) {
      this.formGenerarBloques.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.disponibilidadService.generarBloquesHorarios(
      this.servicioSeleccionado.id,
      this.formGenerarBloques.value
    ).subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire('Éxito', response.message, 'success');
          this.cerrarFormGenerar();
          this.cargarBloques();
        }
      },
      error: (error) => {
        console.error('Error al generar bloques:', error);
        Swal.fire('Error', 'No se pudieron generar los bloques', 'error');
        this.cargando = false;
      }
    });
  }

  abrirFormBloquear(): void {
    this.mostrarFormBloquear = true;
    this.formBloquearBloque.patchValue({
      fecha: this.fechaSeleccionada,
      motivo: 'MANTENIMIENTO'
    });
  }

  cerrarFormBloquear(): void {
    this.mostrarFormBloquear = false;
  }

  bloquearBloque(): void {
    if (this.formBloquearBloque.invalid || !this.servicioSeleccionado?.id) {
      this.formBloquearBloque.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.disponibilidadService.bloquearBloqueServicio(
      this.servicioSeleccionado.id,
      this.formBloquearBloque.value
    ).subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire('Éxito', response.message, 'success');
          this.cerrarFormBloquear();
          this.cargarBloques();
        }
      },
      error: (error) => {
        console.error('Error al bloquear:', error);
        Swal.fire('Error', 'No se pudo bloquear el bloque horario', 'error');
        this.cargando = false;
      }
    });
  }

  obtenerFechaHoy(): string {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getBadgeClass(bloque: BloqueHorario): string {
    return bloque.disponible ? 'badge bg-success' : 'badge bg-danger';
  }

  getEstadoTexto(bloque: BloqueHorario): string {
    return bloque.disponible ? 'Disponible' : (bloque.motivoNoDisponible || 'Bloqueado');
  }

  getBloquesDisponibles(): number {
    return this.bloquesHorarios.filter(b => b.disponible).length;
  }

  getBloquesBloqueados(): number {
    return this.bloquesHorarios.filter(b => !b.disponible).length;
  }
}
