import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { PublicRoutingModule } from './public-routing.module';
import { HomeComponent } from './pages/home/home.component';
import { CabanasCatalogoComponent } from './pages/cabanas-catalogo/cabanas-catalogo.component';
import { ServiciosCatalogoComponent } from './pages/servicios-catalogo/servicios-catalogo.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { PublicNavbarComponent } from './components/public-navbar/public-navbar.component';
import { CabanaDetalleComponent } from './pages/cabana-detalle/cabana-detalle.component';
import { ServicioDetalleComponent } from './pages/servicio-detalle/servicio-detalle.component';

// Angular Material
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';


@NgModule({
  declarations: [
    HomeComponent,
    CabanasCatalogoComponent,
    ServiciosCatalogoComponent,
    RegistroComponent,
    PublicNavbarComponent,
    CabanaDetalleComponent,
    ServicioDetalleComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    PublicRoutingModule,
    // Angular Material
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatFormFieldModule
  ]
})
export class PublicModule { }
