import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CabanaService } from '../../../../../core/services/cabana.service';
import { EstadoCabana, TipoCabana } from '../../../../../core/models/cabana.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cabana-form',
  templateUrl: './cabana-form.component.html',
  styleUrls: ['./cabana-form.component.scss']
})
export class CabanaFormComponent implements OnInit {

  cabanaForm!: FormGroup;
  isEditMode = false;
  cabanaId: number | null = null;
  loading = false;
  submitting = false;

  // Enums para los selects
  estados = Object.values(EstadoCabana);
  tiposCabana = Object.values(TipoCabana);

  constructor(
    private fb: FormBuilder,
    private cabanaService: CabanaService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  initForm(): void {
    this.cabanaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', [Validators.required, Validators.maxLength(1000)]],
      precioPorUnidad: ['', [Validators.required, Validators.min(1)]],
      estado: ['DISPONIBLE', Validators.required],
      capacidadPersonas: ['', [Validators.required, Validators.min(1)]],
      numeroHabitaciones: ['', [Validators.required, Validators.min(1)]],
      numeroBanos: ['', [Validators.required, Validators.min(1)]],
      metrosCuadrados: ['', [Validators.required, Validators.min(1)]],
      tipoCabana: ['STANDARD', Validators.required],
      serviciosIncluidos: ['', Validators.maxLength(2000)]
    });
  }

  checkEditMode(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.cabanaId = +id;
        this.loadCabana(this.cabanaId);
      }
    });
  }

  loadCabana(id: number): void {
    this.loading = true;
    this.cabanaService.obtenerPorId(id).subscribe({
      next: (cabana) => {
        this.cabanaForm.patchValue({
          nombre: cabana.nombre,
          descripcion: cabana.descripcion,
          precioPorUnidad: cabana.precioPorUnidad,
          estado: cabana.estado,
          capacidadPersonas: cabana.capacidadPersonas,
          numeroHabitaciones: cabana.numeroHabitaciones,
          numeroBanos: cabana.numeroBanos,
          metrosCuadrados: cabana.metrosCuadrados,
          tipoCabana: cabana.tipoCabana,
          serviciosIncluidos: cabana.serviciosIncluidos
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar cabaña:', error);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la información de la cabaña',
          confirmButtonColor: '#dc3545'
        }).then(() => {
          this.volver();
        });
      }
    });
  }

  onSubmit(): void {
    if (this.cabanaForm.invalid) {
      this.markFormGroupTouched(this.cabanaForm);
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor completa todos los campos requeridos correctamente',
        confirmButtonColor: '#667eea'
      });
      return;
    }

    this.submitting = true;

    const cabanaData = this.cabanaForm.value;

    if (this.isEditMode && this.cabanaId) {
      this.actualizarCabana(this.cabanaId, cabanaData);
    } else {
      this.crearCabana(cabanaData);
    }
  }

  crearCabana(data: any): void {
    this.cabanaService.crearCabana(data).subscribe({
      next: (response) => {
        this.submitting = false;
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: '¡Cabaña creada!',
            text: response.message,
            confirmButtonColor: '#667eea'
          }).then(() => {
            this.router.navigate(['/admin/cabanas']);
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
        console.error('Error al crear cabaña:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudo crear la cabaña',
          confirmButtonColor: '#dc3545'
        });
      }
    });
  }

  actualizarCabana(id: number, data: any): void {
    this.cabanaService.actualizarCabana(id, data).subscribe({
      next: (response) => {
        this.submitting = false;
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: '¡Cabaña actualizada!',
            text: response.message,
            confirmButtonColor: '#667eea'
          }).then(() => {
            this.router.navigate(['/admin/cabanas']);
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
        console.error('Error al actualizar cabaña:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudo actualizar la cabaña',
          confirmButtonColor: '#dc3545'
        });
      }
    });
  }

  volver(): void {
    this.router.navigate(['/admin/cabanas']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getTipoCabanaLabel(tipo: string): string {
    const labels: { [key: string]: string } = {
      'ECONOMICA': 'Económica',
      'STANDARD': 'Standard',
      'PREMIUM': 'Premium',
      'DELUXE': 'Deluxe'
    };
    return labels[tipo] || tipo;
  }

}
