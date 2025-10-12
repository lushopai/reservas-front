import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HeaderComponent } from './components/header/header.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsuariosListComponent } from './pages/usuarios/usuarios-list/usuarios-list.component';
import { UsuarioDetailComponent } from './pages/usuarios/usuario-detail/usuario-detail.component';
import { UsuarioFormComponent } from './pages/usuarios/usuario-form/usuario-form.component';
import { ReservasListComponent } from './pages/reservas-admin/reservas-list/reservas-list.component';
import { ReservaDetailComponent } from './pages/reservas-admin/reserva-detail/reserva-detail.component';


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
    ReservaDetailComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class AdminModule { }
