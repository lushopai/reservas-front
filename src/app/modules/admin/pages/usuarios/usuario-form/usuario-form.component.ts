import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { UserService } from '../../../../../core/services/UserService.service';

@Component({
  selector: 'app-usuario-form',
  templateUrl: './usuario-form.component.html',
  styleUrls: ['./usuario-form.component.scss']
})
export class UsuarioFormComponent implements OnInit {
  usuarioForm!: FormGroup;
  isEditMode = false;
  userId?: number;
  loading = false;
  submitting = false;
  showPassword = false;
  showConfirmPassword = false;

  // Tipos de documento disponibles
  tiposDocumento = [
    { value: 'RUT', label: 'RUT (Chile)' },
    { value: 'DNI', label: 'DNI' },
    { value: 'PASAPORTE', label: 'Pasaporte' },
    { value: 'CEDULA', label: 'Cédula' },
    { value: 'OTRO', label: 'Otro' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  initForm(): void {
    this.usuarioForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.pattern(/^[0-9]{9,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      documento: ['', [Validators.required]],
      tipoDocumento: ['', [Validators.required]],
      enabled: [true]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Solo limpiar el error si no hay otros errores
      const errors = confirmPassword.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        if (Object.keys(errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
      return null;
    }
  }

  checkEditMode(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.userId = +id;
      this.loadUsuario(this.userId);

      // En modo edición, la contraseña no es requerida
      this.usuarioForm.get('password')?.clearValidators();
      this.usuarioForm.get('confirmPassword')?.clearValidators();
      this.usuarioForm.get('password')?.updateValueAndValidity();
      this.usuarioForm.get('confirmPassword')?.updateValueAndValidity();
    }
  }

  loadUsuario(id: number): void {
    this.loading = true;

    this.userService.getProfile(id).subscribe({
      next: (usuario) => {
        console.log('info user: ', usuario);
        this.usuarioForm.patchValue({
          nombre: usuario.nombre,
          apellidos: usuario.apellidos,
          email: usuario.email,
          telefono: usuario.telefono,
          documento: usuario.documento,
          tipoDocumento: usuario.tipoDocumento,
          enabled: usuario.enabled !== undefined ? usuario.enabled : true
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar usuario:', error);
        this.loading = false;

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la información del usuario',
          confirmButtonColor: '#dc3545'
        }).then(() => {
          this.volver();
        });
      }
    });
  }

  onSubmit(): void {
    if (this.usuarioForm.invalid) {
      this.markFormGroupTouched(this.usuarioForm);

      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor completa todos los campos requeridos correctamente',
        confirmButtonColor: '#3f51b5'
      });
      return;
    }

    this.submitting = true;

    const formData = { ...this.usuarioForm.value };
    delete formData.confirmPassword;

    // Si es modo edición y no se cambió la contraseña, eliminarla del payload
    if (this.isEditMode && !formData.password) {
      delete formData.password;
    }

    if (this.isEditMode) {
      this.updateUsuario(formData);
    } else {
      this.createUsuario(formData);
    }
  }

  createUsuario(data: any): void {
    this.userService.createUser(data).subscribe({
      next: (response) => {
        this.submitting = false;

        // Verificar si la respuesta fue exitosa
        if (response.success === false) {
          Swal.fire({
            icon: 'error',
            title: 'Error de validación',
            text: response.message || 'No se pudo crear el usuario',
            confirmButtonColor: '#dc3545'
          });
          return;
        }

        // Si fue exitoso
        Swal.fire({
          icon: 'success',
          title: '¡Usuario creado!',
          text: 'El usuario ha sido creado exitosamente',
          confirmButtonColor: '#3f51b5'
        }).then(() => {
          this.router.navigate(['/admin/usuarios']);
        });
      },
      error: (error) => {
        this.submitting = false;
        console.error('Error al crear usuario:', error);

        let errorMessage = 'No se pudo crear el usuario';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 409) {
          errorMessage = 'El email ya está registrado';
        } else if (error.status === 400) {
          errorMessage = 'Datos inválidos. Verifica el formulario';
        }

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage,
          confirmButtonColor: '#dc3545'
        });
      }
    });
  }

  updateUsuario(data: any): void {
    if (!this.userId) return;

    this.userService.updateUser(this.userId, data).subscribe({
      next: (response) => {
        this.submitting = false;

        Swal.fire({
          icon: 'success',
          title: '¡Usuario actualizado!',
          text: 'Los datos han sido actualizados exitosamente',
          confirmButtonColor: '#3f51b5'
        }).then(() => {
          this.router.navigate(['/admin/usuarios']);
        });
      },
      error: (error: any) => {
        this.submitting = false;
        console.error('Error al actualizar usuario:', error);

        let errorMessage = 'No se pudo actualizar el usuario';
        if (error.error?.message) {
          errorMessage = error.error.message;
        }

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage,
          confirmButtonColor: '#dc3545'
        });
      }
    });
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  volver(): void {
    this.router.navigate(['/admin/usuarios']);
  }

  // Helpers para validación
  isFieldInvalid(fieldName: string): boolean {
    const field = this.usuarioForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.usuarioForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;

    if (errors['required']) return 'Este campo es requerido';
    if (errors['email']) return 'Email inválido';
    if (errors['minlength']) {
      return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    }
    if (errors['pattern']) {
      if (fieldName === 'telefono') return 'Formato de teléfono inválido (9-15 dígitos)';
      return 'Formato inválido';
    }
    if (errors['passwordMismatch']) return 'Las contraseñas no coinciden';

    return 'Error de validación';
  }
}
