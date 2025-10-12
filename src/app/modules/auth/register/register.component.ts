import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { RegisterRequest } from 'src/app/shared/models/RegisterRequest';
import { UserService } from 'src/app/core/services/UserService.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  showPassword = false;
  showConfirmPassword = false;

  tiposDocumento = [
    { value: 'RUT', label: 'RUT' },
    { value: 'DNI', label: 'DNI' },
    { value: 'PASAPORTE', label: 'Pasaporte' },
    { value: 'CEDULA', label: 'Cédula' },
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService, // CAMBIADO: ClienteService -> UserService
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.registerForm = this.fb.group(
      {
        nombres: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
          ],
        ],
        apellidos: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
          ],
        ],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]], // AGREGADO
        telefono: [
          '',
          [
            Validators.required,
            Validators.pattern(/^\+?[0-9]{9,15}$/), // Formato internacional
          ],
        ],
        documento: ['', [Validators.required, Validators.minLength(7)]],
        tipoDocumento: ['RUT', Validators.required],
        aceptaTerminos: [false, [Validators.requiredTrue]],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  // Validador personalizado para confirmar contraseña
  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  get f() {
    return this.registerForm.controls;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    // Validar formulario
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach((key) => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;

    // Preparar datos (sin confirmPassword ni aceptaTerminos)
    const registerData: RegisterRequest = {
      nombre: this.registerForm.value.nombres,
      apellidos: this.registerForm.value.apellidos,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      telefono: this.registerForm.value.telefono,
      documento: this.registerForm.value.documento,
      tipoDocumento: this.registerForm.value.tipoDocumento,
    };

    console.log('📤 Enviando datos de registro:', {
      ...registerData,
      password: '***', // No loguear la contraseña real
    });

    // Llamar al servicio unificado
    this.userService.register(registerData).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('✅ Respuesta exitosa del servidor:', response);

        if (response.success) {
          this.registerForm.reset();

          Swal.fire({
            icon: 'success',
            title: '¡Registro exitoso!',
            text: response.message || 'Tu cuenta ha sido creada correctamente',
            confirmButtonText: 'Iniciar Sesión',
            confirmButtonColor: '#667eea',
          }).then((result) => {
            if (result.isConfirmed) {
              this.router.navigate(['/auth/login']);
            }
          });
        } else {
          console.warn('Registro no exitoso:', response);
          this.showError(response.message || 'Error al crear la cuenta');;
        }
      },
      error: (error) => {
         this.loading = false;
        console.error('❌ Error en el registro:', error);
        console.error('Error completo:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        this.handleError(error);
      },
    });
  }

  private handleError(error: any): void {
    let errorMessage = 'Ocurrió un error al crear la cuenta';

    if (error.status === 400) {
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (typeof error.error === 'string') {
        if (error.error.includes('email')) {
          errorMessage = 'El correo electrónico ya está registrado';
        } else if (error.error.includes('documento')) {
          errorMessage = 'El documento ya está registrado';
        }
      }
    } else if (error.status === 0) {
      errorMessage = 'No se pudo conectar con el servidor';
    } else if (error.status === 500) {
      errorMessage = 'Error en el servidor. Intente nuevamente más tarde';
    }

    this.showError(errorMessage);
  }

  private showError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error al registrarse',
      text: message,
      confirmButtonColor: '#dc3545',
    });
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
