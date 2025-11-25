import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { CabanaService } from '../../../../../core/services/cabana.service';
import { DisponibilidadService } from '../../../../../core/services/disponibilidad.service';
import { Cabana } from '../../../../../core/models/cabana.model';
import { DisponibilidadCabana, DiaCalendario } from '../../../../../core/models/disponibilidad.model';

@Component({
  selector: 'app-disponibilidad-cabanas',
  templateUrl: './disponibilidad-cabanas.component.html',
  styleUrls: ['./disponibilidad-cabanas.component.scss']
})
export class DisponibilidadCabanasComponent implements OnInit {
  cabanas: Cabana[] = [];
  cabanaSeleccionada?: Cabana;

  mesActual: Date = new Date();
  diasCalendario: DiaCalendario[] = [];
  disponibilidades: Map<string, DisponibilidadCabana> = new Map();

  formBloqueo!: FormGroup;
  mostrarFormBloqueo = false;
  cargando = false;

  constructor(
    private cabanaService: CabanaService,
    private disponibilidadService: DisponibilidadService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.inicializarFormBloqueo();
    this.cargarCabanas();
  }

  inicializarFormBloqueo(): void {
    this.formBloqueo = this.fb.group({
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      motivo: ['MANTENIMIENTO'],
      precioEspecial: [null]
    });
  }

  cargarCabanas(): void {
    this.cabanaService.obtenerTodas().subscribe({
      next: (data) => {
        this.cabanas = data.filter(c => c.id !== undefined);
        if (this.cabanas.length > 0) {
          this.seleccionarCabana(this.cabanas[0]);
        }
      },
      error: (error) => {
        console.error('Error al cargar cabañas:', error);
        Swal.fire('Error', 'No se pudieron cargar las cabañas', 'error');
      }
    });
  }

  seleccionarCabana(cabana: Cabana): void {
    this.cabanaSeleccionada = cabana;
    this.cargarCalendario();
  }

  cargarCalendario(): void {
    if (!this.cabanaSeleccionada?.id) return;

    this.cargando = true;
    const primerDia = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth(), 1);
    const ultimoDia = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 0);

    const fechaInicio = this.formatearFecha(primerDia);
    const fechaFin = this.formatearFecha(ultimoDia);

    this.disponibilidadService.obtenerCalendarioCabana(
      this.cabanaSeleccionada.id,
      fechaInicio,
      fechaFin
    ).subscribe({
      next: (disponibilidades) => {
        // Crear mapa de disponibilidades
        this.disponibilidades.clear();
        disponibilidades.forEach(d => {
          this.disponibilidades.set(d.fecha, d);
        });

        // Generar días del calendario
        this.generarDiasCalendario();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar calendario:', error);
        this.generarDiasCalendario(); // Mostrar calendario vacío
        this.cargando = false;
      }
    });
  }

  generarDiasCalendario(): void {
    const primerDia = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth(), 1);
    const ultimoDia = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 0);

    this.diasCalendario = [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Agregar días vacíos al inicio (para alinear con día de la semana)
    const diaSemanaInicio = primerDia.getDay();
    for (let i = 0; i < diaSemanaInicio; i++) {
      const fechaVacia = new Date(primerDia);
      fechaVacia.setDate(primerDia.getDate() - (diaSemanaInicio - i));
      this.diasCalendario.push({
        fecha: fechaVacia,
        disponible: false,
        esHoy: false,
        esPasado: true
      });
    }

    // Agregar días del mes
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth(), dia);
      const fechaStr = this.formatearFecha(fecha);
      const disp = this.disponibilidades.get(fechaStr);

      this.diasCalendario.push({
        fecha: fecha,
        disponible: disp?.disponible ?? true,
        esHoy: fecha.getTime() === hoy.getTime(),
        esPasado: fecha < hoy,
        motivo: disp?.motivoNoDisponible,
        precioEspecial: disp?.precioEspecial
      });
    }
  }

  mesAnterior(): void {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() - 1, 1);
    this.cargarCalendario();
  }

  mesSiguiente(): void {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 1);
    this.cargarCalendario();
  }

  getNombreMes(): string {
    return this.mesActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }

  abrirFormBloqueo(): void {
    this.mostrarFormBloqueo = true;
    this.formBloqueo.reset({ motivo: 'MANTENIMIENTO' });
  }

  cerrarFormBloqueo(): void {
    this.mostrarFormBloqueo = false;
  }

  bloquearFechas(): void {
    if (this.formBloqueo.invalid || !this.cabanaSeleccionada?.id) {
      this.formBloqueo.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const formValue = this.formBloqueo.value;
    
    // Convertir fechas de Date a string si es necesario
    const fechaInicio = formValue.fechaInicio instanceof Date 
      ? this.formatearFecha(formValue.fechaInicio)
      : formValue.fechaInicio;
    const fechaFin = formValue.fechaFin instanceof Date
      ? this.formatearFecha(formValue.fechaFin)
      : formValue.fechaFin;

    const datosBloqueo = {
      ...formValue,
      fechaInicio: fechaInicio,
      fechaFin: fechaFin
    };

    this.disponibilidadService.bloquearFechasCabana(
      this.cabanaSeleccionada.id,
      datosBloqueo
    ).subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire('Éxito', response.message, 'success');
          this.cerrarFormBloqueo();
          this.cargarCalendario();
        }
      },
      error: (error) => {
        console.error('Error al bloquear:', error);
        Swal.fire('Error', 'No se pudieron bloquear las fechas', 'error');
        this.cargando = false;
      }
    });
  }

  desbloquearDia(dia: DiaCalendario): void {
    if (!this.cabanaSeleccionada?.id || dia.disponible || dia.motivo === 'RESERVADA') {
      return;
    }

    Swal.fire({
      title: '¿Desbloquear fecha?',
      text: `¿Deseas desbloquear el ${dia.fecha.toLocaleDateString('es-ES')}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, desbloquear',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && this.cabanaSeleccionada?.id) {
        const fechaStr = this.formatearFecha(dia.fecha);
        this.disponibilidadService.desbloquearFechasCabana(
          this.cabanaSeleccionada.id,
          fechaStr,
          fechaStr
        ).subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire('Éxito', response.message, 'success');
              this.cargarCalendario();
            }
          },
          error: (error) => {
            console.error('Error al desbloquear:', error);
            Swal.fire('Error', 'No se pudo desbloquear la fecha', 'error');
          }
        });
      }
    });
  }

  formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getClaseDia(dia: DiaCalendario): string {
    const clases = ['dia-calendario'];

    if (dia.esPasado && dia.fecha.getMonth() !== this.mesActual.getMonth()) {
      clases.push('dia-otro-mes');
    } else if (dia.esHoy) {
      clases.push('dia-hoy');
    } else if (!dia.disponible) {
      clases.push('dia-bloqueado');
    } else if (!dia.esPasado) {
      clases.push('dia-disponible');
    }

    return clases.join(' ');
  }
}
