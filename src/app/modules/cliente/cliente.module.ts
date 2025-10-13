import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { ClienteRoutingModule } from './cliente-routing.module';
import { ClienteComponent } from './cliente.component';
import { MisReservasComponent } from './pages/mis-reservas/mis-reservas.component';
import { NuevaReservaComponent } from './pages/nueva-reserva/nueva-reserva.component';


@NgModule({
  declarations: [
    ClienteComponent,
    MisReservasComponent,
    NuevaReservaComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ClienteRoutingModule
  ]
})
export class ClienteModule { }
