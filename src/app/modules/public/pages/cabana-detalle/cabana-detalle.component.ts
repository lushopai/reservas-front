import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CabanaService } from '../../../../core/services/cabana.service';
import { DisponibilidadService } from '../../../../core/services/disponibilidad.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ServicioEntretencionService } from '../../../../core/services/servicio-entretencion.service';
import { Cabana } from '../../../../core/models/cabana.model';
import { ServicioEntretencion } from '../../../../core/models/servicio.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cabana-detalle',
  templateUrl: './cabana-detalle.component.html',
  styleUrls: ['./cabana-detalle.component.scss']
})
export class CabanaDetalleComponent implements OnInit {
  cabana?: Cabana;
  cargando = true;
  imagenActual = 0;

  // Form Group para Date Range Picker
  rangoFechas = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null)
  });

  // Datos de reserva
  verificandoDisponibilidad = false;
  disponibilidadVerificada = false;
  disponible = false;
  precioCalculado: number = 0;
  numeroNoches: number = 0;

  // Fechas bloqueadas (ocupadas)
  fechasOcupadas: Date[] = [];
  cargandoFechas = false;

  // Servicios adicionales opcionales
  serviciosDisponibles: ServicioEntretencion[] = [];
  serviciosSeleccionados: Map<number, any> = new Map();
  cargandoServicios = false;
  mostrarServicios = true; // Mostrar expandido por defecto

  // Getters para acceder a las fechas del form
  get fechaInicio(): Date | null {
    return this.rangoFechas.get('start')?.value || null;
  }

  get fechaFin(): Date | null {
    return this.rangoFechas.get('end')?.value || null;
  }

  // Ubicación por defecto (puedes configurar esto desde el backend)
  ubicacion = {
    lat: -33.4489,
    lng: -70.6693,
    nombre: 'Santiago, Chile'
  };

  // Fecha mínima (hoy)
  fechaMinima: Date = new Date();

  // Filtro de fechas para el datepicker
  dateFilter = (date: Date | null): boolean => {
    if (!date) return true;

    // No permitir fechas pasadas
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (date < hoy) return false;

    // Bloquear fechas ocupadas
    return !this.esFechaOcupada(date);
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cabanaService: CabanaService,
    private disponibilidadService: DisponibilidadService,
    private authService: AuthService,
    private servicioService: ServicioEntretencionService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarCabana(+id);
      this.cargarServiciosDisponibles();
    }

    // Escuchar cambios en el rango de fechas
    this.rangoFechas.valueChanges.subscribe(() => {
      this.onFechaChange();
    });
  }

  cargarCabana(id: number): void {
    this.cargando = true;
    this.cabanaService.obtenerPorId(id).subscribe({
      next: (cabana) => {
        this.cabana = cabana;
        this.cargando = false;
        // Cargar fechas ocupadas después de cargar la cabaña
        this.cargarFechasOcupadas(id);
      },
      error: (error) => {
        console.error('Error al cargar cabaña:', error);
        this.cargando = false;
        Swal.fire('Error', 'No se pudo cargar la información de la cabaña', 'error')
          .then(() => this.router.navigate(['/cabanas']));
      }
    });
  }

  cargarFechasOcupadas(cabanaId: number): void {
    this.cargandoFechas = true;
    // Consultar próximos 6 meses de disponibilidad
    const fechaInicio = new Date();
    const fechaFin = new Date();
    fechaFin.setMonth(fechaFin.getMonth() + 6);

    const fechaInicioStr = this.formatearFechaParaBackend(fechaInicio);
    const fechaFinStr = this.formatearFechaParaBackend(fechaFin);

    this.disponibilidadService.obtenerFechasOcupadas(
      cabanaId,
      fechaInicioStr,
      fechaFinStr
    ).subscribe({
      next: (fechasStr: string[]) => {
        // Convertir strings ISO a objetos Date
        this.fechasOcupadas = fechasStr.map(fechaStr => new Date(fechaStr + 'T00:00:00'));
        this.cargandoFechas = false;
        console.log(`Fechas ocupadas cargadas: ${this.fechasOcupadas.length} fechas`);
      },
      error: (error) => {
        console.error('Error al cargar fechas ocupadas:', error);
        this.cargandoFechas = false;
        // No mostrar error al usuario, simplemente no bloquear fechas
      }
    });
  }

  esFechaOcupada(date: Date): boolean {
    return this.fechasOcupadas.some(fechaOcupada =>
      fechaOcupada.toDateString() === date.toDateString()
    );
  }

  cargarServiciosDisponibles(): void {
    this.cargandoServicios = true;
    this.servicioService.obtenerPorEstado('DISPONIBLE').subscribe({
      next: (servicios) => {
        this.serviciosDisponibles = servicios;
        this.cargandoServicios = false;
        console.log(`Servicios disponibles: ${servicios.length}`);
      },
      error: (error) => {
        console.error('Error al cargar servicios:', error);
        this.cargandoServicios = false;
      }
    });
  }

  toggleServicio(servicioId: number): void {
    if (this.serviciosSeleccionados.has(servicioId)) {
      this.serviciosSeleccionados.delete(servicioId);
    } else {
      // Valores por defecto para el servicio
      const servicio = this.serviciosDisponibles.find(s => s.id === servicioId);
      this.serviciosSeleccionados.set(servicioId, {
        servicioId: servicioId,
        fecha: this.formatearFechaParaBackend(this.fechaInicio!),
        horaInicio: '10:00',
        duracionBloques: 1,
        nombre: servicio?.nombre
      });
    }
  }

  isServicioSeleccionado(servicioId: number): boolean {
    return this.serviciosSeleccionados.has(servicioId);
  }

  actualizarServicio(servicioId: number, campo: string, valor: any): void {
    const servicio = this.serviciosSeleccionados.get(servicioId);
    if (servicio) {
      servicio[campo] = valor;
      this.serviciosSeleccionados.set(servicioId, servicio);
    }
  }

  calcularPrecioConServicios(): number {
    let precioTotal = this.precioCalculado;

    this.serviciosSeleccionados.forEach((datos, servicioId) => {
      const servicio = this.serviciosDisponibles.find(s => s.id === servicioId);
      if (servicio && servicio.precioPorUnidad) {
        precioTotal += servicio.precioPorUnidad * datos.duracionBloques;
      }
    });

    return precioTotal;
  }

  calcularPrecioServicio(servicioId: number, duracionBloques: number): number {
    const servicio = this.serviciosDisponibles.find(s => s.id === servicioId);
    return (servicio?.precioPorUnidad || 0) * duracionBloques;
  }

  formatearFechaParaBackend(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  cambiarImagen(index: number): void {
    if (this.cabana?.imagenes && index >= 0 && index < this.cabana.imagenes.length) {
      this.imagenActual = index;
    }
  }

  imagenAnterior(): void {
    if (this.cabana?.imagenes && this.imagenActual > 0) {
      this.imagenActual--;
    }
  }

  imagenSiguiente(): void {
    if (this.cabana?.imagenes && this.imagenActual < this.cabana.imagenes.length - 1) {
      this.imagenActual++;
    }
  }

  verificarDisponibilidad(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      Swal.fire('Fechas requeridas', 'Por favor selecciona las fechas de tu estadía', 'warning');
      return;
    }

    // Validar que fecha fin sea posterior a fecha inicio
    if (this.fechaFin <= this.fechaInicio) {
      Swal.fire('Fechas inválidas', 'La fecha de salida debe ser posterior a la fecha de entrada', 'warning');
      return;
    }

    if (!this.cabana?.id) return;

    this.verificandoDisponibilidad = true;
    this.disponibilidadVerificada = false;

    const fechaInicioStr = this.formatearFechaParaBackend(this.fechaInicio);
    const fechaFinStr = this.formatearFechaParaBackend(this.fechaFin);

    this.disponibilidadService.consultarDisponibilidadCabana(
      this.cabana.id,
      fechaInicioStr,
      fechaFinStr
    ).subscribe({
      next: (response) => {
        this.disponible = response.disponible;
        this.disponibilidadVerificada = true;
        this.verificandoDisponibilidad = false;

        if (this.disponible) {
          this.calcularPrecio();
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'No disponible',
            text: 'La cabaña no está disponible para las fechas seleccionadas. Por favor elige otras fechas.'
          });
        }
      },
      error: (error) => {
        console.error('Error al verificar disponibilidad:', error);
        this.verificandoDisponibilidad = false;
        Swal.fire('Error', 'No se pudo verificar la disponibilidad. Intenta nuevamente.', 'error');
      }
    });
  }

  calcularPrecio(): void {
    if (!this.fechaInicio || !this.fechaFin || !this.cabana?.precioPorUnidad) return;

    const diferencia = this.fechaFin.getTime() - this.fechaInicio.getTime();
    this.numeroNoches = Math.ceil(diferencia / (1000 * 3600 * 24));
    this.precioCalculado = this.numeroNoches * this.cabana.precioPorUnidad;
  }

  onFechaChange(): void {
    // Reset disponibilidad cuando cambian las fechas
    this.disponibilidadVerificada = false;
    this.disponible = false;
    this.precioCalculado = 0;
    this.numeroNoches = 0;
  }

  reservar(): void {
    if (!this.disponibilidadVerificada || !this.disponible) {
      Swal.fire('Verifica disponibilidad', 'Por favor verifica la disponibilidad antes de reservar', 'warning');
      return;
    }

    if (!this.fechaInicio || !this.fechaFin) return;

    // Preparar servicios seleccionados
    const serviciosArray = Array.from(this.serviciosSeleccionados.values());

    // Guardar datos de la reserva en sessionStorage (convertir Date a string)
    const reservaData: any = {
      tipo: this.serviciosSeleccionados.size > 0 ? 'paquete' : 'cabana',
      cabanaId: this.cabana?.id,
      cabana: this.cabana,
      fechaInicio: this.formatearFechaParaBackend(this.fechaInicio),
      fechaFin: this.formatearFechaParaBackend(this.fechaFin),
      numeroNoches: this.numeroNoches,
      precioCalculado: this.precioCalculado,
      precioTotal: this.calcularPrecioConServicios()
    };

    // Si hay servicios seleccionados, es un paquete
    if (this.serviciosSeleccionados.size > 0) {
      reservaData.servicios = serviciosArray;
    }

    sessionStorage.setItem('reserva_pendiente', JSON.stringify(reservaData));

    // Verificar si está autenticado
    if (!this.authService.isAuthenticated()) {
      Swal.fire({
        icon: 'info',
        title: 'Inicia sesión para continuar',
        text: 'Tus datos de reserva se guardarán y podrás continuar después de iniciar sesión',
        showCancelButton: true,
        confirmButtonText: 'Iniciar Sesión',
        cancelButtonText: 'Registrarse',
        confirmButtonColor: '#667eea'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/auth/login'], {
            queryParams: { returnUrl: '/cliente/confirmar-reserva' }
          });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          this.router.navigate(['/registro'], {
            queryParams: { returnUrl: '/cliente/confirmar-reserva' }
          });
        }
      });
    } else {
      // Ya está autenticado, ir directo a confirmación
      this.router.navigate(['/cliente/confirmar-reserva']);
    }
  }

  volver(): void {
    this.router.navigate(['/cabanas']);
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CL').format(precio);
  }
}
