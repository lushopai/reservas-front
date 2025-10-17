import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CabanaService } from '../../../../core/services/cabana.service';
import { ServicioEntretencionService } from '../../../../core/services/servicio-entretencion.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  cabanasDestacadas: any[] = [];
  serviciosDestacados: any[] = [];
  cargando = true;

  features = [
    {
      icon: 'cottage',
      title: 'Cabañas Cómodas',
      description: 'Espacios acogedores totalmente equipados para tu descanso'
    },
    {
      icon: 'stars',
      title: 'Servicios Premium',
      description: 'Disfruta de actividades y servicios de primera calidad'
    },
    {
      icon: 'event_available',
      title: 'Reserva Fácil',
      description: 'Sistema de reservas en línea simple y seguro'
    },
    {
      icon: 'verified_user',
      title: 'Pago Seguro',
      description: 'Transacciones protegidas con los mejores sistemas de pago'
    }
  ];

  constructor(
    private router: Router,
    private cabanaService: CabanaService,
    private servicioService: ServicioEntretencionService
  ) {}

  ngOnInit(): void {
    this.cargarDatosDestacados();
  }

  cargarDatosDestacados(): void {
    this.cargando = true;

    // Cargar solo las primeras 3 cabañas
    this.cabanaService.obtenerTodas().subscribe({
      next: (cabanas) => {
        this.cabanasDestacadas = cabanas.slice(0, 3);
      },
      error: (error) => {
        console.error('Error al cargar cabañas:', error);
      }
    });

    // Cargar solo los primeros 3 servicios
    this.servicioService.obtenerTodos().subscribe({
      next: (servicios) => {
        this.serviciosDestacados = servicios.slice(0, 3);
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar servicios:', error);
        this.cargando = false;
      }
    });
  }

  verCabanas(): void {
    this.router.navigate(['/cabanas']);
  }

  verServicios(): void {
    this.router.navigate(['/servicios']);
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  obtenerImagenPrincipal(item: any): string {
    if (item.imagenes && item.imagenes.length > 0) {
      const imagenPrincipal = item.imagenes.find((img: any) => img.esPrincipal);
      return imagenPrincipal ? imagenPrincipal.url : item.imagenes[0].url;
    }
    return '';
  }
}
