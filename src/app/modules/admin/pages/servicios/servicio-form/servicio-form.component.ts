import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ServicioEntretencionService } from '../../../../../core/services/servicio-entretencion.service';
import { EstadoServicio, TipoServicio } from '../../../../../core/models/servicio.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-servicio-form',
  templateUrl: './servicio-form.component.html',
  styleUrls: ['./servicio-form.component.scss']
})
export class ServicioFormComponent implements OnInit {

  servicioForm!: FormGroup;
  isEditMode = false;
  servicioId: number | null = null;
  loading = false;
  submitting = false;

  // Enums para los selects
  estados = Object.values(EstadoServicio);
  tipos = Object.values(TipoServicio);

  constructor(
    private fb: FormBuilder,
    private servicioService: ServicioEntretencionService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  initForm(): void {
    this.servicioForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', [Validators.required, Validators.maxLength(1000)]],
      precioPorUnidad: ['', [Validators.required, Validators.min(1)]],
      estado: ['DISPONIBLE', Validators.required],
      tipoServicio: ['PISCINA', Validators.required],
      capacidadMaxima: ['', [Validators.required, Validators.min(1)]],
      duracionBloqueMinutos: [60, [Validators.required, Validators.min(15)]],
      requiereSupervision: [false, Validators.required]
    });
  }

  checkEditMode(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.servicioId = +id;
        this.loadServicio(this.servicioId);
      }
    });
  }

  loadServicio(id: number): void {
    this.loading = true;
    this.servicioService.obtenerPorId(id).subscribe({
      next: (servicio) => {
        this.servicioForm.patchValue({
          nombre: servicio.nombre,
          descripcion: servicio.descripcion,
          precioPorUnidad: servicio.precioPorUnidad,
          estado: servicio.estado,
          tipoServicio: servicio.tipoServicio,
          capacidadMaxima: servicio.capacidadMaxima,
          duracionBloqueMinutos: servicio.duracionBloqueMinutos,
          requiereSupervision: servicio.requiereSupervision
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar servicio:', error);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la información del servicio',
          confirmButtonColor: '#dc3545'
        }).then(() => {
          this.volver();
        });
      }
    });
  }

  onSubmit(): void {
    if (this.servicioForm.invalid) {
      this.markFormGroupTouched(this.servicioForm);
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor completa todos los campos requeridos correctamente',
        confirmButtonColor: '#667eea'
      });
      return;
    }

    this.submitting = true;
    const servicioData = this.servicioForm.value;

    if (this.isEditMode && this.servicioId) {
      this.actualizarServicio(this.servicioId, servicioData);
    } else {
      this.crearServicio(servicioData);
    }
  }

  crearServicio(data: any): void {
    this.servicioService.crearServicio(data).subscribe({
      next: (response) => {
        this.submitting = false;
        if (response.success && response.data) {
          Swal.fire({
            icon: 'success',
            title: '¡Servicio creado!',
            html: `
              <p>${response.message}</p>
              <p class="text-muted small">Ahora puedes agregar imágenes al servicio</p>
            `,
            confirmButtonText: 'Agregar imágenes',
            showCancelButton: true,
            cancelButtonText: 'Volver a la lista',
            confirmButtonColor: '#667eea',
            cancelButtonColor: '#6c757d'
          }).then((result) => {
            if (result.isConfirmed) {
              // Redirigir al modo edición con el ID del servicio creado
              this.router.navigate(['/admin/servicios/editar', response.data.id]);
            } else {
              this.router.navigate(['/admin/servicios']);
            }
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: response.message,
            confirmButtonColor: '#dc3545'
          });
        }
      },
      error: (error) => {
        this.submitting = false;
        console.error('Error al crear servicio:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudo crear el servicio',
          confirmButtonColor: '#dc3545'
        });
      }
    });
  }

  actualizarServicio(id: number, data: any): void {
    this.servicioService.actualizarServicio(id, data).subscribe({
      next: (response) => {
        this.submitting = false;
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: '¡Servicio actualizado!',
            text: response.message,
            confirmButtonColor: '#667eea'
          }).then(() => {
            this.router.navigate(['/admin/servicios']);
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: response.message,
            confirmButtonColor: '#dc3545'
          });
        }
      },
      error: (error) => {
        this.submitting = false;
        console.error('Error al actualizar servicio:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudo actualizar el servicio',
          confirmButtonColor: '#dc3545'
        });
      }
    });
  }

  volver(): void {
    this.router.navigate(['/admin/servicios']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getTipoServicioLabel(tipo: string): string {
    const labels: { [key: string]: string } = {
      'CANCHA_TENIS': 'Cancha de Tenis',
      'CANCHA_FUTBOL': 'Cancha de Fútbol',
      'PISCINA': 'Piscina',
      'QUINCHO': 'Quincho',
      'SPA': 'Spa',
      'GIMNASIO': 'Gimnasio',
      'SALA_JUEGOS': 'Sala de Juegos',
      'SALON_EVENTOS': 'Salón de Eventos'
    };
    return labels[tipo] || tipo;
  }

}
