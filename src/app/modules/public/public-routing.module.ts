import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CabanasCatalogoComponent } from './pages/cabanas-catalogo/cabanas-catalogo.component';
import { ServiciosCatalogoComponent } from './pages/servicios-catalogo/servicios-catalogo.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { CabanaDetalleComponent } from './pages/cabana-detalle/cabana-detalle.component';
import { ServicioDetalleComponent } from './pages/servicio-detalle/servicio-detalle.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    data: { title: 'Inicio' }
  },
  {
    path: 'cabanas',
    component: CabanasCatalogoComponent,
    data: { title: 'Nuestras Cabañas' }
  },
  {
    path: 'cabanas/:id',
    component: CabanaDetalleComponent,
    data: { title: 'Detalle de Cabaña' }
  },
  {
    path: 'servicios',
    component: ServiciosCatalogoComponent,
    data: { title: 'Servicios' }
  },
  {
    path: 'servicios/:id',
    component: ServicioDetalleComponent,
    data: { title: 'Detalle de Servicio' }
  },
  {
    path: 'registro',
    component: RegistroComponent,
    data: { title: 'Registro' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PublicRoutingModule { }
