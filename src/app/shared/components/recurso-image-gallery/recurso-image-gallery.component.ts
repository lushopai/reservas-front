import { Component, Input, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { RecursoImagen } from '../../../core/models/recurso-imagen.model';
import { RecursoImagenService } from '../../../core/services/recurso-imagen.service';

@Component({
  selector: 'app-recurso-image-gallery',
  templateUrl: './recurso-image-gallery.component.html',
  styleUrls: ['./recurso-image-gallery.component.scss']
})
export class RecursoImageGalleryComponent implements OnInit {
  @Input() recursoId!: number;
  @Input() soloLectura: boolean = false;

  imagenes: RecursoImagen[] = [];
  cargando = false;
  subiendoImagen = false;

  constructor(private imagenService: RecursoImagenService) {}

  ngOnInit(): void {
    if (this.recursoId) {
      this.cargarImagenes();
    }
  }

  cargarImagenes(): void {
    this.cargando = true;
    this.imagenService.obtenerImagenes(this.recursoId).subscribe({
      next: (imagenes) => {
        this.imagenes = imagenes;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar imágenes:', error);
        this.cargando = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      Swal.fire('Error', 'Solo se permiten archivos de imagen', 'error');
      return;
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire('Error', 'El archivo no puede superar los 5MB', 'error');
      return;
    }

    // Preguntar si es imagen principal
    Swal.fire({
      title: 'Subir Imagen',
      html: `
        <div class="text-start">
          <p><strong>Archivo:</strong> ${file.name}</p>
          <div class="form-check mb-3">
            <input class="form-check-input" type="checkbox" id="esPrincipal">
            <label class="form-check-label" for="esPrincipal">
              Establecer como imagen principal
            </label>
          </div>
          <div class="mb-3">
            <label class="form-label">Descripción (opcional):</label>
            <input type="text" id="descripcion" class="form-control" placeholder="Descripción de la imagen">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Subir',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const esPrincipal = (document.getElementById('esPrincipal') as HTMLInputElement).checked;
        const descripcion = (document.getElementById('descripcion') as HTMLInputElement).value;
        return { esPrincipal, descripcion };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.subirImagen(file, result.value.descripcion, result.value.esPrincipal);
      }
    });

    // Limpiar input
    event.target.value = '';
  }

  subirImagen(file: File, descripcion?: string, esPrincipal?: boolean): void {
    this.subiendoImagen = true;

    Swal.fire({
      title: 'Subiendo imagen...',
      html: 'Por favor espere',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.imagenService.subirImagen(this.recursoId, file, descripcion, esPrincipal).subscribe({
      next: (response) => {
        this.subiendoImagen = false;
        Swal.fire('Éxito', response.message, 'success');
        this.cargarImagenes();
      },
      error: (error) => {
        this.subiendoImagen = false;
        console.error('Error al subir imagen:', error);
        Swal.fire('Error', error.error?.message || 'No se pudo subir la imagen', 'error');
      }
    });
  }

  establecerPrincipal(imagen: RecursoImagen): void {
    if (imagen.esPrincipal) {
      Swal.fire('Info', 'Esta imagen ya es la principal', 'info');
      return;
    }

    Swal.fire({
      title: '¿Establecer como principal?',
      text: 'Esta imagen se mostrará primero en las listas',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, establecer',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && imagen.id) {
        this.imagenService.establecerPrincipal(this.recursoId, imagen.id).subscribe({
          next: (response) => {
            Swal.fire('Éxito', response.message, 'success');
            this.cargarImagenes();
          },
          error: (error) => {
            console.error('Error:', error);
            Swal.fire('Error', 'No se pudo establecer la imagen como principal', 'error');
          }
        });
      }
    });
  }

  eliminarImagen(imagen: RecursoImagen): void {
    Swal.fire({
      title: '¿Eliminar imagen?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && imagen.id) {
        this.imagenService.eliminarImagen(this.recursoId, imagen.id).subscribe({
          next: (response) => {
            Swal.fire('Eliminada', 'La imagen ha sido eliminada', 'success');
            this.cargarImagenes();
          },
          error: (error) => {
            console.error('Error:', error);
            Swal.fire('Error', 'No se pudo eliminar la imagen', 'error');
          }
        });
      }
    });
  }

  verImagen(imagen: RecursoImagen): void {
    Swal.fire({
      title: imagen.descripcion || imagen.nombre || 'Imagen',
      imageUrl: imagen.url,
      imageAlt: imagen.descripcion || 'Imagen del recurso',
      showCloseButton: true,
      showConfirmButton: false,
      width: '80%'
    });
  }
}
