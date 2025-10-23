import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServicioEntretencionService } from '../../../../core/services/servicio-entretencion.service';
import { BloqueHorarioService } from '../../../../core/services/bloque-horario.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ServicioEntretencion } from '../../../../core/models/servicio.model';
import { BloqueHorario } from '../../../../core/models/bloque-horario.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-servicio-detalle',
  templateUrl: './servicio-detalle.component.html',
  styleUrls: ['./servicio-detalle.component.scss']
})
export class ServicioDetalleComponent implements OnInit {
  servicio?: ServicioEntretencion;
  cargando = true;
  imagenActual = 0;

  // Datos de reserva
  fecha: string = '';
  horaInicio: string = '';
  cantidadBloques: number = 1;
  cantidadPersonas: number = 1;
  datosCompletados = false;
  precioCalculado: number = 0;

  // Bloques disponibles
  bloquesDisponibles: BloqueHorario[] = [];
  bloqueSeleccionado?: BloqueHorario;
  cargandoBloques = false;
  modoSeleccionVisual = true; // true = selector visual, false = manual

  // Ubicación por defecto
  ubicacion = {
    lat: -33.4489,
    lng: -70.6693,
    nombre: 'Santiago, Chile'
  };

  // Fecha mínima (hoy)
  get fechaMinima(): string {
    return new Date().toISOString().split('T')[0];
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private servicioService: ServicioEntretencionService,
    private bloqueService: BloqueHorarioService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarServicio(+id);
    }
  }

  cargarServicio(id: number): void {
    this.cargando = true;
    this.servicioService.obtenerPorId(id).subscribe({
      next: (servicio) => {
        this.servicio = servicio;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar servicio:', error);
        this.cargando = false;
        Swal.fire('Error', 'No se pudo cargar la información del servicio', 'error')
          .then(() => this.router.navigate(['/servicios']));
      }
    });
  }

  cambiarImagen(index: number): void {
    if (this.servicio?.imagenes && index >= 0 && index < this.servicio.imagenes.length) {
      this.imagenActual = index;
    }
  }

  imagenAnterior(): void {
    if (this.servicio?.imagenes && this.imagenActual > 0) {
      this.imagenActual--;
    }
  }

  imagenSiguiente(): void {
    if (this.servicio?.imagenes && this.imagenActual < this.servicio.imagenes.length - 1) {
      this.imagenActual++;
    }
  }

  validarDatos(): void {
    if (!this.fecha || !this.horaInicio || this.cantidadBloques < 1 || this.cantidadPersonas < 1) {
      Swal.fire('Datos incompletos', 'Por favor completa todos los campos', 'warning');
      return;
    }

    if (this.servicio?.capacidadMaxima && this.cantidadPersonas > this.servicio.capacidadMaxima) {
      Swal.fire('Capacidad excedida', `La capacidad máxima es de ${this.servicio.capacidadMaxima} personas`, 'warning');
      return;
    }

    this.datosCompletados = true;
    this.calcularPrecio();

    Swal.fire({
      icon: 'success',
      title: 'Datos validados',
      text: 'Datos completos. Puedes proceder con la reserva.',
      timer: 1500,
      showConfirmButton: false
    });
  }

  calcularPrecio(): void {
    if (!this.servicio?.precioPorUnidad) return;
    this.precioCalculado = this.servicio.precioPorUnidad * this.cantidadBloques;
  }

  onDatosChange(): void {
    // Reset cuando cambian los datos
    this.datosCompletados = false;
    this.precioCalculado = 0;
  }

  reservar(): void {
    if (!this.datosCompletados) {
      Swal.fire('Valida los datos', 'Por favor valida los datos de la reserva primero', 'warning');
      return;
    }

    // Guardar datos de la reserva en sessionStorage
    const reservaData = {
      tipo: 'servicio',
      servicioId: this.servicio?.id,
      servicio: this.servicio,
      fecha: this.fecha,
      horaInicio: this.horaInicio,
      cantidadBloques: this.cantidadBloques,
      cantidadPersonas: this.cantidadPersonas,
      precioCalculado: this.precioCalculado
    };

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
    this.router.navigate(['/servicios']);
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CL').format(precio);
  }

  // Cargar bloques disponibles cuando se selecciona una fecha
  cargarBloquesDisponibles(): void {
    if (!this.fecha || !this.servicio?.id) return;

    this.cargandoBloques = true;
    this.bloqueService.obtenerBloquesPorFecha(this.servicio.id, this.fecha).subscribe({
      next: (bloques) => {
        // Filtrar solo bloques disponibles y que no hayan pasado
        const ahora = new Date();
        const fechaSeleccionada = new Date(this.fecha + 'T00:00:00');

        this.bloquesDisponibles = bloques.filter(b => {
          if (!b.disponible) return false;

          // Si la fecha es hoy, verificar que la hora no haya pasado
          if (fechaSeleccionada.toDateString() === ahora.toDateString()) {
            const [horas, minutos] = b.horaInicio.split(':').map(Number);
            const horaBloque = new Date(ahora);
            horaBloque.setHours(horas, minutos, 0, 0);
            return horaBloque > ahora;
          }

          // Si es una fecha futura, mostrar todos los bloques disponibles
          return true;
        });

        this.cargandoBloques = false;
      },
      error: (error) => {
        console.error('Error al cargar bloques:', error);
        this.cargandoBloques = false;
        this.bloquesDisponibles = [];
      }
    });
  }

  // Seleccionar un bloque
  seleccionarBloque(bloque: BloqueHorario): void {
    this.bloqueSeleccionado = bloque;
    this.horaInicio = bloque.horaInicio;
    this.fecha = bloque.fecha;
    this.datosCompletados = false; // Resetear validación
  }

  // Cambiar entre modo visual y manual
  cambiarModoSeleccion(): void {
    this.modoSeleccionVisual = !this.modoSeleccionVisual;
    if (this.modoSeleccionVisual && this.fecha) {
      this.cargarBloquesDisponibles();
    }
  }

  // Listener cuando cambia la fecha
  onFechaChange(): void {
    this.bloqueSeleccionado = undefined;
    this.horaInicio = '';
    this.datosCompletados = false;
    if (this.modoSeleccionVisual) {
      this.cargarBloquesDisponibles();
    }
  }
}
