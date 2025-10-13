import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClienteComponent } from './cliente.component';
import { MisReservasComponent } from './pages/mis-reservas/mis-reservas.component';
import { NuevaReservaComponent } from './pages/nueva-reserva/nueva-reserva.component';

const routes: Routes = [
  {
    path: '',
    component: ClienteComponent,
    children: [
      {
        path: '',
        redirectTo: 'mis-reservas',
        pathMatch: 'full',
      },
      {
        path: 'mis-reservas',
        component: MisReservasComponent,
        data: { title: 'Mis Reservas' },
      },
      {
        path: 'nueva-reserva',
        component: NuevaReservaComponent,
        data: { title: 'Nueva Reserva' },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClienteRoutingModule { }
