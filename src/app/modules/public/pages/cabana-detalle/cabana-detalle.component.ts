import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CabanaService } from '../../../../core/services/cabana.service';
import { DisponibilidadService } from '../../../../core/services/disponibilidad.service';
import { Cabana } from '../../../../core/models/cabana.model';
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

  // Datos de reserva con Date objects para Material Datepicker
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;
  verificandoDisponibilidad = false;
  disponibilidadVerificada = false;
  disponible = false;
  precioCalculado: number = 0;
  numeroNoches: number = 0;

  // Fechas bloqueadas (ocupadas)
  fechasOcupadas: Date[] = [];
  cargandoFechas = false;

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
    private disponibilidadService: DisponibilidadService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarCabana(+id);
    }
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

    this.disponibilidadService.consultarDisponibilidadCabana(
      cabanaId,
      fechaInicioStr,
      fechaFinStr
    ).subscribe({
      next: (response) => {
        this.cargandoFechas = false;
        // Si no está disponible, obtener las fechas ocupadas del motivo
        if (!response.disponible && response.motivo) {
          // Aquí puedes parsear las fechas ocupadas del backend si las envía
          // Por ahora, simplemente marcamos el periodo como ocupado si no está disponible
          console.log('Respuesta disponibilidad:', response);
        }
      },
      error: (error) => {
        console.error('Error al cargar fechas ocupadas:', error);
        this.cargandoFechas = false;
      }
    });
  }

  esFechaOcupada(date: Date): boolean {
    return this.fechasOcupadas.some(fechaOcupada =>
      fechaOcupada.toDateString() === date.toDateString()
    );
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

    // Guardar datos de la reserva en sessionStorage (convertir Date a string)
    const reservaData = {
      tipo: 'cabana',
      cabanaId: this.cabana?.id,
      cabana: this.cabana,
      fechaInicio: this.formatearFechaParaBackend(this.fechaInicio),
      fechaFin: this.formatearFechaParaBackend(this.fechaFin),
      numeroNoches: this.numeroNoches,
      precioCalculado: this.precioCalculado
    };

    sessionStorage.setItem('reserva_pendiente', JSON.stringify(reservaData));

    // Verificar si está autenticado
    const token = localStorage.getItem('token');
    if (!token) {
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
