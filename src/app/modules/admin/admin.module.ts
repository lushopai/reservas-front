import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LayoutModule } from '@angular/cdk/layout';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { SharedModule } from '../../shared/shared.module';

// Angular Material - Layout & Navigation
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

// Angular Material - Tables & Data
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// Angular Material - Forms
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatStepperModule } from '@angular/material/stepper';
import { MatChipsModule } from '@angular/material/chips';

// Angular Material - Indicators & Dialogs
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';

// Angular Material - Others
import { MatDividerModule } from '@angular/material/divider';
import { MatRippleModule } from '@angular/material/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatGridListModule } from '@angular/material/grid-list';
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
    SharedModule,
    LayoutModule,
    // Material - Layout & Navigation
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    // Material - Tables & Data
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCheckboxModule,
    MatProgressBarModule,
    // Material - Forms
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatStepperModule,
    MatChipsModule,
    // Material - Indicators & Dialogs
    MatCardModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatTabsModule,
    // Material - Others
    MatDividerModule,
    MatRippleModule,
    MatButtonToggleModule,
    MatGridListModule
  ]
})
export class AdminModule { }
