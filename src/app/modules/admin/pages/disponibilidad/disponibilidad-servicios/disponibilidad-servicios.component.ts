import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { BloqueHorarioService } from '../../../../../core/services/bloque-horario.service';
import { ServicioEntretencionService } from '../../../../../core/services/servicio-entretencion.service';
import { BloqueHorario } from '../../../../../core/models/bloque-horario.model';

interface ServicioSimple {
  id: number;
  nombre: string;
  duracionBloqueMinutos: number;
}

@Component({
  selector: 'app-disponibilidad-servicios',
  templateUrl: './disponibilidad-servicios.component.html',
  styleUrls: ['./disponibilidad-servicios.component.scss']
})
export class DisponibilidadServiciosComponent implements OnInit {
  // Formularios
  generarForm!: FormGroup;

  // Datos
  servicios: ServicioSimple[] = [];
  bloques: BloqueHorario[] = [];
  bloquesPorDia: Map<string, BloqueHorario[]> = new Map();

  // Estados
  cargando = false;
  generando = false;
  servicioSeleccionado?: ServicioSimple;

  // Fechas
  fechaHoy: string;
  fechaMinima: string;

  // Días de la semana
  diasSemana = [
    { valor: 1, nombre: 'Lunes', seleccionado: true },
    { valor: 2, nombre: 'Martes', seleccionado: true },
    { valor: 3, nombre: 'Miércoles', seleccionado: true },
    { valor: 4, nombre: 'Jueves', seleccionado: true },
    { valor: 5, nombre: 'Viernes', seleccionado: true },
    { valor: 6, nombre: 'Sábado', seleccionado: false },
    { valor: 0, nombre: 'Domingo', seleccionado: false }
  ];

  // Estadísticas
  stats = {
    totalBloques: 0,
    disponibles: 0,
    ocupados: 0,
    bloqueados: 0,
    porcentajeOcupacion: 0
  };

  // Vista actual
  vistaActual: 'generar' | 'calendario' = 'calendario';
  selectedTabIndex: number = 0;

  constructor(
    private fb: FormBuilder,
    private bloqueService: BloqueHorarioService,
    private servicioService: ServicioEntretencionService
  ) {
    const hoy = new Date();
    this.fechaHoy = hoy.toISOString().split('T')[0];
    this.fechaMinima = this.fechaHoy;
  }

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarServicios();
  }

  inicializarFormulario(): void {
    this.generarForm = this.fb.group({
      servicioId: [null, Validators.required],
      fechaInicio: [this.fechaHoy, Validators.required],
      fechaFin: ['', Validators.required],
      horaApertura: ['09:00', Validators.required],
      horaCierre: ['18:00', Validators.required],
      duracionBloqueMinutos: [60, [Validators.required, Validators.min(15)]]
    });

    // Cuando cambia el servicio, actualizar duración
    this.generarForm.get('servicioId')?.valueChanges.subscribe(servicioId => {
      const servicio = this.servicios.find(s => s.id === servicioId);
      if (servicio) {
        this.servicioSeleccionado = servicio;
        this.generarForm.patchValue({
          duracionBloqueMinutos: servicio.duracionBloqueMinutos
        });
      }
    });
  }

  cargarServicios(): void {
    this.cargando = true;
    this.servicioService.obtenerTodos().subscribe({
      next: (servicios) => {
        this.servicios = servicios.map(s => ({
          id: s.id!,
          nombre: s.nombre,
          duracionBloqueMinutos: s.duracionBloqueMinutos || 60
        }));
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar servicios:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los servicios',
          confirmButtonColor: '#dc3545'
        });
        this.cargando = false;
      }
    });
  }

  calcularBloquesEstimados(): number {
    if (!this.generarForm.valid) return 0;

    const valores = this.generarForm.value;
    const fechaInicio = new Date(valores.fechaInicio);
    const fechaFin = new Date(valores.fechaFin);

    // Calcular días en el rango
    const dias = Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Calcular bloques por día
    const [horaInicioH, horaInicioM] = valores.horaApertura.split(':').map(Number);
    const [horaFinH, horaFinM] = valores.horaCierre.split(':').map(Number);

    const minutosApertura = horaInicioH * 60 + horaInicioM;
    const minutosCierre = horaFinH * 60 + horaFinM;
    const minutosTotales = minutosCierre - minutosApertura;

    const bloquesPorDia = Math.floor(minutosTotales / valores.duracionBloqueMinutos);

    // Contar días seleccionados
    const diasSeleccionados = this.diasSemana.filter(d => d.seleccionado).length;

    // Estimación (asumiendo distribución uniforme de días de la semana)
    const estimado = Math.floor((dias * diasSeleccionados / 7) * bloquesPorDia);

    return estimado > 0 ? estimado : 0;
  }

  generarBloques(): void {
    if (this.generarForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor completa todos los campos requeridos',
        confirmButtonColor: '#3f51b5'
      });
      return;
    }

    const valores = this.generarForm.value;
    const diasSeleccionados = this.diasSemana
      .filter(d => d.seleccionado)
      .map(d => d.valor);

    if (diasSeleccionados.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Selecciona días',
        text: 'Debes seleccionar al menos un día de la semana',
        confirmButtonColor: '#3f51b5'
      });
      return;
    }

    const bloquesEstimados = this.calcularBloquesEstimados();

    Swal.fire({
      title: '¿Generar bloques horarios?',
      html: `
        <p>Se generarán aproximadamente <strong>${bloquesEstimados} bloques</strong></p>
        <ul class="text-start" style="list-style: none; padding-left: 0;">
          <li>📅 Período: ${valores.fechaInicio} a ${valores.fechaFin}</li>
          <li>⏰ Horario: ${valores.horaApertura} - ${valores.horaCierre}</li>
          <li>⏱️ Duración: ${valores.duracionBloqueMinutos} minutos</li>
          <li>📆 Días: ${this.diasSemana.filter(d => d.seleccionado).map(d => d.nombre.substring(0, 3)).join(', ')}</li>
        </ul>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Generar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3f51b5'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarGeneracion(diasSeleccionados);
      }
    });
  }

  ejecutarGeneracion(diasSeleccionados: number[]): void {
    this.generando = true;
    const valores = this.generarForm.value;

    // Vamos a generar día por día
    const fechaInicio = new Date(valores.fechaInicio + 'T00:00:00');  // Forzar hora local
    const fechaFin = new Date(valores.fechaFin + 'T00:00:00');  // Forzar hora local
    const promesas: any[] = [];

    let fechaActual = new Date(fechaInicio);
    while (fechaActual <= fechaFin) {
      const diaSemana = fechaActual.getDay();

      // Solo generar si el día está seleccionado
      if (diasSeleccionados.includes(diaSemana)) {
        const request = {
          fecha: fechaActual.toISOString().split('T')[0],
          horaApertura: valores.horaApertura,
          horaCierre: valores.horaCierre,
          duracionBloqueMinutos: valores.duracionBloqueMinutos
        };

        promesas.push(
          this.bloqueService.generarBloques(valores.servicioId, request).toPromise()
        );
      }

      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    Promise.all(promesas)
      .then(() => {
        this.generando = false;
        Swal.fire({
          icon: 'success',
          title: 'Bloques generados',
          text: `Se generaron bloques para ${promesas.length} días exitosamente`,
          timer: 3000,
          showConfirmButton: false
        });

        // Cambiar a vista de calendario
        this.vistaActual = 'calendario';
        this.cargarBloques();
      })
      .catch((error) => {
        this.generando = false;
        console.error('Error al generar bloques:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al generar los bloques',
          confirmButtonColor: '#dc3545'
        });
      });
  }

  cargarBloques(): void {
    if (!this.servicioSeleccionado) return;

    const valores = this.generarForm.value;
    if (!valores.fechaInicio || !valores.fechaFin) return;

    this.cargando = true;
    this.bloqueService.obtenerBloquesPorRango(
      valores.servicioId,
      valores.fechaInicio,
      valores.fechaFin
    ).subscribe({
      next: (bloques) => {
        this.bloques = bloques;
        this.agruparBloquesPorDia();
        this.calcularEstadisticas();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar bloques:', error);
        this.cargando = false;
      }
    });
  }

  agruparBloquesPorDia(): void {
    this.bloquesPorDia.clear();

    this.bloques.forEach(bloque => {
      if (!this.bloquesPorDia.has(bloque.fecha)) {
        this.bloquesPorDia.set(bloque.fecha, []);
      }
      this.bloquesPorDia.get(bloque.fecha)!.push(bloque);
    });

    // Ordenar bloques dentro de cada día
    this.bloquesPorDia.forEach(bloques => {
      bloques.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    });
  }

  calcularEstadisticas(): void {
    this.stats.totalBloques = this.bloques.length;
    this.stats.disponibles = this.bloques.filter(b => b.disponible).length;
    this.stats.ocupados = this.bloques.filter(b => !b.disponible && b.motivoNoDisponible === 'RESERVADO').length;
    this.stats.bloqueados = this.bloques.filter(b => !b.disponible && b.motivoNoDisponible !== 'RESERVADO').length;
    this.stats.porcentajeOcupacion = this.stats.totalBloques > 0
      ? Math.round((this.stats.ocupados / this.stats.totalBloques) * 100)
      : 0;
  }

  bloquearBloque(bloque: BloqueHorario): void {
    Swal.fire({
      title: 'Bloquear bloque',
      text: '¿Motivo del bloqueo?',
      input: 'select',
      inputOptions: {
        'MANTENIMIENTO': 'Mantenimiento',
        'CLIMA': 'Clima adverso',
        'EVENTO_PRIVADO': 'Evento privado',
        'OTRO': 'Otro motivo'
      },
      showCancelButton: true,
      confirmButtonText: 'Bloquear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed && this.servicioSeleccionado) {
        const request = {
          fecha: bloque.fecha,
          horaInicio: bloque.horaInicio,
          horaFin: bloque.horaFin,
          motivo: result.value
        };

        this.bloqueService.bloquearBloque(this.servicioSeleccionado.id, request).subscribe({
          next: () => {
            bloque.disponible = false;
            bloque.motivoNoDisponible = result.value;
            this.calcularEstadisticas();
            Swal.fire({
              icon: 'success',
              title: 'Bloque bloqueado',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('Error al bloquear:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo bloquear el bloque',
              confirmButtonColor: '#dc3545'
            });
          }
        });
      }
    });
  }

  desbloquearBloque(bloque: BloqueHorario): void {
    if (bloque.motivoNoDisponible === 'RESERVADO') {
      Swal.fire({
        icon: 'warning',
        title: 'Bloque reservado',
        text: 'No se puede desbloquear un bloque con reserva activa',
        confirmButtonColor: '#3f51b5'
      });
      return;
    }

    Swal.fire({
      title: '¿Desbloquear bloque?',
      text: 'El bloque volverá a estar disponible',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Desbloquear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745'
    }).then((result) => {
      if (result.isConfirmed && bloque.id) {
        this.bloqueService.desbloquearBloque(bloque.id).subscribe({
          next: () => {
            bloque.disponible = true;
            bloque.motivoNoDisponible = undefined;
            this.calcularEstadisticas();
            Swal.fire({
              icon: 'success',
              title: 'Bloque desbloqueado',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('Error al desbloquear:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo desbloquear el bloque',
              confirmButtonColor: '#dc3545'
            });
          }
        });
      }
    });
  }

  obtenerFechasOrdenadas(): string[] {
    return Array.from(this.bloquesPorDia.keys()).sort();
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }

  getEstadoClass(bloque: BloqueHorario): string {
    if (bloque.disponible) return 'disponible';
    if (bloque.motivoNoDisponible === 'RESERVADO') return 'ocupado';
    return 'bloqueado';
  }

  getEstadoIcon(bloque: BloqueHorario): string {
    if (bloque.disponible) return 'check_circle';
    if (bloque.motivoNoDisponible === 'RESERVADO') return 'event_busy';
    return 'block';
  }

  cambiarVista(index: number): void {
    this.selectedTabIndex = index;
    this.vistaActual = index === 0 ? 'calendario' : 'generar';
    if (this.vistaActual === 'calendario' && this.servicioSeleccionado) {
      this.cargarBloques();
    }
  }

  obtenerDiasSeleccionados(): string {
    const dias = this.diasSemana
      .filter(d => d.seleccionado)
      .map(d => d.nombre.substring(0, 3));
    return dias.length > 0 ? dias.join(', ') : 'Ninguno';
  }
}
