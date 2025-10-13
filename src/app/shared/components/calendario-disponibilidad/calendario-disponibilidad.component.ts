import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DisponibilidadService } from '../../../core/services/disponibilidad.service';

interface DiaCalendario {
  fecha: Date;
  disponible: boolean;
  esHoy: boolean;
  esPasado: boolean;
  seleccionado: boolean;
  esInicio: boolean;
  esFin: boolean;
  enRango: boolean;
  precio?: number;
  motivoNoDisponible?: string;
}

@Component({
  selector: 'app-calendario-disponibilidad',
  templateUrl: './calendario-disponibilidad.component.html',
  styleUrls: ['./calendario-disponibilidad.component.scss']
})
export class CalendarioDisponibilidadComponent implements OnInit {
  @Input() cabanaId!: number;
  @Input() fechaInicio?: Date;
  @Input() fechaFin?: Date;
  @Output() rangoSeleccionado = new EventEmitter<{ inicio: Date, fin: Date }>();

  mesActual: Date = new Date();
  diasCalendario: DiaCalendario[][] = [];
  seleccionandoInicio = true;
  fechaInicioSeleccionada?: Date;
  fechaFinSeleccionada?: Date;
  cargando = false;

  diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  constructor(private disponibilidadService: DisponibilidadService) {}

  ngOnInit(): void {
    if (this.fechaInicio) {
      this.fechaInicioSeleccionada = this.fechaInicio;
    }
    if (this.fechaFin) {
      this.fechaFinSeleccionada = this.fechaFin;
      this.seleccionandoInicio = false;
    }
    this.cargarCalendario();
  }

  cargarCalendario(): void {
    if (!this.cabanaId) return;

    this.cargando = true;
    const primerDia = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth(), 1);
    const ultimoDia = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 0);

    // Consultar disponibilidad del mes completo
    const fechaInicio = this.formatearFecha(primerDia);
    const fechaFin = this.formatearFecha(ultimoDia);

    this.disponibilidadService.obtenerCalendarioCabana(this.cabanaId, fechaInicio, fechaFin)
      .subscribe({
        next: (disponibilidades) => {
          this.generarDiasCalendario(disponibilidades);
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al cargar disponibilidad:', error);
          // Generar calendario sin información de disponibilidad
          this.generarDiasCalendario([]);
          this.cargando = false;
        }
      });
  }

  generarDiasCalendario(disponibilidades: any[]): void {
    const primerDiaMes = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth(), 1);
    const ultimoDiaMes = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 0);
    const primerDiaSemana = primerDiaMes.getDay(); // 0 = Domingo

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    this.diasCalendario = [];
    let semana: DiaCalendario[] = [];

    // Días vacíos al inicio
    for (let i = 0; i < primerDiaSemana; i++) {
      semana.push({
        fecha: new Date(0),
        disponible: false,
        esHoy: false,
        esPasado: true,
        seleccionado: false,
        esInicio: false,
        esFin: false,
        enRango: false
      });
    }

    // Días del mes
    for (let dia = 1; dia <= ultimoDiaMes.getDate(); dia++) {
      const fecha = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth(), dia);
      fecha.setHours(0, 0, 0, 0);

      const fechaStr = this.formatearFecha(fecha);
      const disponibilidad = disponibilidades.find(d => d.fecha === fechaStr);

      const esPasado = fecha < hoy;
      const disponible = disponibilidad ? disponibilidad.disponible : !esPasado;

      const diaCalendario: DiaCalendario = {
        fecha,
        disponible: disponible && !esPasado,
        esHoy: fecha.getTime() === hoy.getTime(),
        esPasado,
        seleccionado: this.esFechaSeleccionada(fecha),
        esInicio: this.esFechaInicio(fecha),
        esFin: this.esFechaFin(fecha),
        enRango: this.estaEnRango(fecha),
        precio: disponibilidad?.precioEspecial,
        motivoNoDisponible: disponibilidad?.motivoNoDisponible
      };

      semana.push(diaCalendario);

      if (semana.length === 7) {
        this.diasCalendario.push(semana);
        semana = [];
      }
    }

    // Completar última semana
    if (semana.length > 0) {
      while (semana.length < 7) {
        semana.push({
          fecha: new Date(0),
          disponible: false,
          esHoy: false,
          esPasado: true,
          seleccionado: false,
          esInicio: false,
          esFin: false,
          enRango: false
        });
      }
      this.diasCalendario.push(semana);
    }
  }

  seleccionarDia(dia: DiaCalendario): void {
    if (!dia.disponible || dia.esPasado) return;

    if (this.seleccionandoInicio) {
      // Seleccionar fecha de inicio
      this.fechaInicioSeleccionada = dia.fecha;
      this.fechaFinSeleccionada = undefined;
      this.seleccionandoInicio = false;
    } else {
      // Seleccionar fecha de fin
      if (dia.fecha < this.fechaInicioSeleccionada!) {
        // Si es anterior al inicio, reiniciar
        this.fechaInicioSeleccionada = dia.fecha;
        this.fechaFinSeleccionada = undefined;
        this.seleccionandoInicio = false;
      } else {
        this.fechaFinSeleccionada = dia.fecha;
        this.seleccionandoInicio = true;

        // Emitir rango seleccionado
        this.rangoSeleccionado.emit({
          inicio: this.fechaInicioSeleccionada!,
          fin: this.fechaFinSeleccionada
        });
      }
    }

    // Regenerar calendario para actualizar estilos
    this.cargarCalendario();
  }

  limpiarSeleccion(): void {
    this.fechaInicioSeleccionada = undefined;
    this.fechaFinSeleccionada = undefined;
    this.seleccionandoInicio = true;
    this.cargarCalendario();
  }

  mesAnterior(): void {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() - 1, 1);
    this.cargarCalendario();
  }

  mesSiguiente(): void {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 1);
    this.cargarCalendario();
  }

  esFechaSeleccionada(fecha: Date): boolean {
    if (!this.fechaInicioSeleccionada) return false;
    return fecha.getTime() === this.fechaInicioSeleccionada.getTime() ||
           (this.fechaFinSeleccionada && fecha.getTime() === this.fechaFinSeleccionada.getTime());
  }

  esFechaInicio(fecha: Date): boolean {
    if (!this.fechaInicioSeleccionada) return false;
    return fecha.getTime() === this.fechaInicioSeleccionada.getTime();
  }

  esFechaFin(fecha: Date): boolean {
    if (!this.fechaFinSeleccionada) return false;
    return fecha.getTime() === this.fechaFinSeleccionada.getTime();
  }

  estaEnRango(fecha: Date): boolean {
    if (!this.fechaInicioSeleccionada || !this.fechaFinSeleccionada) return false;
    return fecha > this.fechaInicioSeleccionada && fecha < this.fechaFinSeleccionada;
  }

  formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  get tituloMes(): string {
    return `${this.meses[this.mesActual.getMonth()]} ${this.mesActual.getFullYear()}`;
  }

  get textoSeleccion(): string {
    if (!this.fechaInicioSeleccionada) {
      return 'Selecciona la fecha de entrada';
    }
    if (!this.fechaFinSeleccionada) {
      return 'Selecciona la fecha de salida';
    }
    return `${this.formatearFechaLegible(this.fechaInicioSeleccionada)} - ${this.formatearFechaLegible(this.fechaFinSeleccionada)}`;
  }

  formatearFechaLegible(fecha: Date): string {
    const dia = fecha.getDate();
    const mes = this.meses[fecha.getMonth()];
    return `${dia} ${mes}`;
  }
}
