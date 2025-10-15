import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { SharedModule } from '../../shared/shared.module';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HeaderComponent } from './components/header/header.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsuariosListComponent } from './pages/usuarios/usuarios-list/usuarios-list.component';
import { UsuarioDetailComponent } from './pages/usuarios/usuario-detail/usuario-detail.component';
import { UsuarioFormComponent } from './pages/usuarios/usuario-form/usuario-form.component';
import { ReservasListComponent } from './pages/reservas-admin/reservas-list/reservas-list.component';
import { ReservaDetailComponent } from './pages/reservas-admin/reserva-detail/reserva-detail.component';
import { CabanasListComponent } from './pages/cabanas/cabanas-list/cabanas-list.component';
import { CabanaFormComponent } from './pages/cabanas/cabana-form/cabana-form.component';
import { ServiciosListComponent } from './pages/servicios/servicios-list/servicios-list.component';
import { ServicioFormComponent } from './pages/servicios/servicio-form/servicio-form.component';
import { InventarioListComponent } from './pages/inventario/inventario-list/inventario-list.component';
import { InventarioFormComponent } from './pages/inventario/inventario-form/inventario-form.component';
import { DisponibilidadCabanasComponent } from './pages/disponibilidad/disponibilidad-cabanas/disponibilidad-cabanas.component';
import { DisponibilidadServiciosComponent } from './pages/disponibilidad/disponibilidad-servicios/disponibilidad-servicios.component';
import { PagosListComponent } from './pages/pagos/pagos-list/pagos-list.component';


@NgModule({
  declarations: [
    AdminComponent,
    SidebarComponent,
    HeaderComponent,
    DashboardComponent,
    UsuariosListComponent,
    UsuarioDetailComponent,
    UsuarioFormComponent,
    ReservasListComponent,
    ReservaDetailComponent,
    CabanasListComponent,
    CabanaFormComponent,
    ServiciosListComponent,
    ServicioFormComponent,
    InventarioListComponent,
    InventarioFormComponent,
    DisponibilidadCabanasComponent,
    DisponibilidadServiciosComponent,
    PagosListComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule
  ]
})
export class AdminModule { }
