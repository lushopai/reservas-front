import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsuariosListComponent } from './pages/usuarios/usuarios-list/usuarios-list.component';
import { UsuarioFormComponent } from './pages/usuarios/usuario-form/usuario-form.component';
import { UsuarioDetailComponent } from './pages/usuarios/usuario-detail/usuario-detail.component';
import { ReservasListComponent } from './pages/reservas-admin/reservas-list/reservas-list.component';
import { ReservaDetailComponent } from './pages/reservas-admin/reserva-detail/reserva-detail.component';
import { ReservaFormComponent } from './pages/reservas-admin/reserva-form/reserva-form.component';
import { CabanasListComponent } from './pages/cabanas/cabanas-list/cabanas-list.component';
import { CabanaFormComponent } from './pages/cabanas/cabana-form/cabana-form.component';
import { ServiciosListComponent } from './pages/servicios/servicios-list/servicios-list.component';
import { ServicioFormComponent } from './pages/servicios/servicio-form/servicio-form.component';
import { InventarioListComponent } from './pages/inventario/inventario-list/inventario-list.component';
import { InventarioFormComponent } from './pages/inventario/inventario-form/inventario-form.component';
import { DisponibilidadCabanasComponent } from './pages/disponibilidad/disponibilidad-cabanas/disponibilidad-cabanas.component';
import { DisponibilidadServiciosComponent } from './pages/disponibilidad/disponibilidad-servicios/disponibilidad-servicios.component';
import { PagosListComponent } from './pages/pagos/pagos-list/pagos-list.component';
import { MovimientosListComponent } from './pages/movimientos-inventario/movimientos-list/movimientos-list.component';
import { BloquesGestionComponent } from './pages/bloques-horarios/bloques-gestion/bloques-gestion.component';

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
            path: 'nueva',
            component: ReservaFormComponent,
            data: { title: 'Nueva Reserva' },
          },
          {
            path: ':id',
            component: ReservaDetailComponent,
            data: { title: 'Detalle de Reserva' },
          },
        ],
      },
      {
        path: 'cabanas',
        children: [
          {
            path: '',
            component: CabanasListComponent,
            data: { title: 'Gestión de Cabañas' },
          },
          {
            path: 'nueva',
            component: CabanaFormComponent,
            data: { title: 'Nueva Cabaña' },
          },
          {
            path: 'editar/:id',
            component: CabanaFormComponent,
            data: { title: 'Editar Cabaña' },
          },
        ],
      },
      {
        path: 'servicios',
        children: [
          {
            path: '',
            component: ServiciosListComponent,
            data: { title: 'Gestión de Servicios' },
          },
          {
            path: 'nuevo',
            component: ServicioFormComponent,
            data: { title: 'Nuevo Servicio' },
          },
          {
            path: 'editar/:id',
            component: ServicioFormComponent,
            data: { title: 'Editar Servicio' },
          },
        ],
      },
      {
        path: 'inventario',
        children: [
          {
            path: '',
            component: InventarioListComponent,
            data: { title: 'Gestión de Inventario' },
          },
          {
            path: 'nuevo',
            component: InventarioFormComponent,
            data: { title: 'Nuevo Item de Inventario' },
          },
          {
            path: 'editar/:id',
            component: InventarioFormComponent,
            data: { title: 'Editar Item de Inventario' },
          },
        ],
      },
      {
        path: 'disponibilidad',
        children: [
          {
            path: '',
            redirectTo: 'cabanas',
            pathMatch: 'full',
          },
          {
            path: 'cabanas',
            component: DisponibilidadCabanasComponent,
            data: { title: 'Disponibilidad de Cabañas' },
          },
          {
            path: 'servicios',
            component: DisponibilidadServiciosComponent,
            data: { title: 'Bloques Horarios de Servicios' },
          },
        ],
      },
      {
        path: 'pagos',
        component: PagosListComponent,
        data: { title: 'Gestión de Pagos' },
      },
      {
        path: 'movimientos',
        component: MovimientosListComponent,
        data: { title: 'Movimientos de Inventario' },
      },
      {
        path: 'bloques-horarios',
        component: BloquesGestionComponent,
        data: { title: 'Gestión de Bloques Horarios' },
      },
    ],
  },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
