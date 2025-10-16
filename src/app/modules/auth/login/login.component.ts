import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup = this.fb.group({
    // Inicialización inmediata
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });
  loading = false;
  showPassword = false;
  returnUrl: string = '/dashboard';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Si ya está autenticado, redirigir
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    // Obtener URL de retorno si existe
    this.returnUrl =
      this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }



  get f() {
    return this.loginForm.controls;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach((key) => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;

    const credentials = {
      username: this.loginForm.value.username,
      password: this.loginForm.value.password,
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('Login exitoso:', response);
        // ⚠️ PRIMERO redirigir según el rol
        const user = this.authService.getCurrentUser();
        const isAdmin = user?.roles?.some(
          (role: any) => role.name === 'ROLE_ADMIN' || role === 'ROLE_ADMIN'
        );

        Swal.fire({
          icon: 'success',
          title: '¡Bienvenido!',
          text: 'Inicio de sesión exitoso',
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          this.loading = false; //Detener el loading despues del msg
          // Redirigir después del modal

          // Si hay returnUrl, usarlo (para flujo de reservas)
          if (this.returnUrl && this.returnUrl !== '/dashboard') {
            console.log('Redirigiendo a returnUrl:', this.returnUrl);
            this.router.navigate([this.returnUrl]);
          } else {
            // Caso por defecto: redirigir según rol
            if (isAdmin) {
              console.log('se va por admin');
              this.router.navigate(['/admin/dashboard']);
            } else {
              console.log('se va por cliente');
              this.router.navigate(['/cliente/mis-reservas']);
            }
          }
        });
      },
      error: (error) => {
        console.error('Error en login:', error);

        this.loading = false;

        let errorMessage = 'Credenciales inválidas';

        if (error.status === 401) {
          errorMessage = 'Usuario o contraseña incorrectos';
        } else if (error.status === 0) {
          errorMessage = 'No se pudo conectar con el servidor';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        Swal.fire({
          icon: 'error',
          title: 'Error de autenticación',
          text: errorMessage,
          confirmButtonColor: '#3085d6',
        });
      },
      complete: () => {
        this.loading = false; //Detener el loading en cualquier caso
      },
    });
  }

  goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }
}
