import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecursoImageGalleryComponent } from './components/recurso-image-gallery/recurso-image-gallery.component';
import { CalendarioDisponibilidadComponent } from './components/calendario-disponibilidad/calendario-disponibilidad.component';

@NgModule({
  declarations: [
    RecursoImageGalleryComponent,
    CalendarioDisponibilidadComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    RecursoImageGalleryComponent,
    CalendarioDisponibilidadComponent
  ]
})
export class SharedModule { }
