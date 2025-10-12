import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsuariosListComponent } from './pages/usuarios/usuarios-list/usuarios-list.component';
import { UsuarioFormComponent } from './pages/usuarios/usuario-form/usuario-form.component';
import { UsuarioDetailComponent } from './pages/usuarios/usuario-detail/usuario-detail.component';
import { ReservasListComponent } from './pages/reservas-admin/reservas-list/reservas-list.component';
import { ReservaDetailComponent } from './pages/reservas-admin/reserva-detail/reserva-detail.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
        data: { title: 'Dashboard Administrativo' },
      },
      {
        path: 'usuarios',
        children: [
          {
            path: '',
            component: UsuariosListComponent,
            data: { title: 'Gestión de Usuarios' },
          },
          {
            path: 'nuevo',
            component: UsuarioFormComponent,
            data: { title: 'Nuevo Usuario' },
          },
          {
            path: ':id',
            component: UsuarioDetailComponent,
            data: { title: 'Detalle de Usuario' },
          },
          {
            path: ':id/editar',
            component: UsuarioFormComponent,
            data: { title: 'Editar Usuario' },
          },
        ],
      },
      {
        path: 'reservas',
        children: [
          {
            path: '',
            component: ReservasListComponent,
            data: { title: 'Gestión de Reservas' },
          },
          {
            path: ':id',
            component: ReservaDetailComponent,
            data: { title: 'Detalle de Reserva' },
          },
        ],
      },
    ],
  },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
