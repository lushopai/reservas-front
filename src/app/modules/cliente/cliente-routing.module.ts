import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClienteComponent } from './cliente.component';
import { MisReservasComponent } from './pages/mis-reservas/mis-reservas.component';
import { NuevaReservaComponent } from './pages/nueva-reserva/nueva-reserva.component';
import { ConfirmarPagoComponent } from './pages/confirmar-pago/confirmar-pago.component';
import { NuevaReservaPaqueteComponent } from './pages/nueva-reserva-paquete/nueva-reserva-paquete.component';
import { ConfirmarReservaComponent } from './pages/confirmar-reserva/confirmar-reserva.component';

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
      {
        path: 'nueva-reserva-paquete',
        component: NuevaReservaPaqueteComponent,
        data: { title: 'Nueva Reserva - Paquete' },
      },
      {
        path: 'confirmar-pago/:id',
        component: ConfirmarPagoComponent,
        data: { title: 'Confirmar Pago' },
      },
      {
        path: 'confirmar-reserva',
        component: ConfirmarReservaComponent,
        data: { title: 'Confirmar Reserva' },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClienteRoutingModule { }
