import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cliente',
  templateUrl: './cliente.component.html',
  styleUrls: ['./cliente.component.scss']
})
export class ClienteComponent {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  logout(): void {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro de que quieres salir?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#667eea',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();

        Swal.fire({
          icon: 'success',
          title: 'Sesión cerrada',
          text: 'Has cerrado sesión exitosamente',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  }

}
