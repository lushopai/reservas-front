import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { ClienteRoutingModule } from './cliente-routing.module';
import { ClienteComponent } from './cliente.component';
import { MisReservasComponent } from './pages/mis-reservas/mis-reservas.component';
import { NuevaReservaComponent } from './pages/nueva-reserva/nueva-reserva.component';
import { ConfirmarPagoComponent } from './pages/confirmar-pago/confirmar-pago.component';
import { NuevaReservaPaqueteComponent } from './pages/nueva-reserva-paquete/nueva-reserva-paquete.component';


@NgModule({
  declarations: [
    ClienteComponent,
    MisReservasComponent,
    NuevaReservaComponent,
    ConfirmarPagoComponent,
    NuevaReservaPaqueteComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ClienteRoutingModule
  ]
})
export class ClienteModule { }
