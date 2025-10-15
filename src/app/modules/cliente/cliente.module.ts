import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { ClienteRoutingModule } from './cliente-routing.module';
import { ClienteComponent } from './cliente.component';
import { MisReservasComponent } from './pages/mis-reservas/mis-reservas.component';
import { NuevaReservaComponent } from './pages/nueva-reserva/nueva-reserva.component';
import { ConfirmarPagoComponent } from './pages/confirmar-pago/confirmar-pago.component';
import { NuevaReservaPaqueteComponent } from './pages/nueva-reserva-paquete/nueva-reserva-paquete.component';
import { SharedModule } from '../../shared/shared.module';


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
    ClienteRoutingModule,
    SharedModule
  ]
})
export class ClienteModule { }
