import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  returnUrl: string = '';

  tiposDocumento = [
    { value: 'RUT', label: 'RUT' },
    { value: 'DNI', label: 'DNI' },
    { value: 'PASAPORTE', label: 'Pasaporte' },
    { value: 'CEDULA', label: 'Cédula' },
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService, // CAMBIADO: ClienteService -> UserService
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.initForm();
    // Obtener URL de retorno si existe
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';
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
            Validators.pattern(/^[0-9]{9}$/), // 9 dígitos para Chile
            Validators.minLength(9),
            Validators.maxLength(9)
          ],
        ],
        documento: ['', [Validators.required, this.rutValidator]],
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
      apellidos: this.registerForm.value.apellidos,  // Mantener apellidos (plural)
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      telefono: this.registerForm.value.telefono,
      documento: this.registerForm.value.documento,
      tipoDocumento: this.registerForm.value.tipoDocumento,
    };

    console.log('Enviando datos de registro:', {
      ...registerData,
      password: '***', // No loguear la contraseña real
    });

    // Llamar al servicio unificado
    this.userService.register(registerData).subscribe({
      next: (response) => {
        this.loading = false;

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
              // Redirigir al login preservando el returnUrl si existe
              if (this.returnUrl) {
                this.router.navigate(['/auth/login'], {
                  queryParams: { returnUrl: this.returnUrl }
                });
              } else {
                this.router.navigate(['/auth/login']);
              }
            }
          });
        } else {
          console.warn('Registro no exitoso:', response);
          this.showError(response.message || 'Error al crear la cuenta');;
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error en el registro:', error);
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

  /**
   * Validador de RUT chileno
   */
  rutValidator(control: any): { [key: string]: boolean } | null {
    if (!control.value) return null;

    const rut = control.value.replace(/[^0-9kK]/g, ''); // Remover formato
    if (rut.length < 8) return { rutInvalido: true };

    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1).toUpperCase();

    // Calcular dígito verificador
    let suma = 0;
    let multiplo = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo[i]) * multiplo;
      multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }

    const dvEsperado = 11 - (suma % 11);
    const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();

    return dv === dvCalculado ? null : { rutInvalido: true };
  }

  /**
   * Formatear RUT mientras el usuario escribe
   */
  formatearRUT(event: any): void {
    let valor = event.target.value.replace(/[^0-9kK]/g, ''); // Solo números y K

    if (valor.length > 1) {
      const cuerpo = valor.slice(0, -1);
      const dv = valor.slice(-1);

      // Formatear con puntos y guión
      const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      valor = `${cuerpoFormateado}-${dv}`;
    }

    this.registerForm.patchValue({ documento: valor }, { emitEvent: false });
  }
}
